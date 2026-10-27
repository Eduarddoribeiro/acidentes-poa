"""Validation and cleaning of the accident dataset (M1 and M2).

The functions here are pure: they take a DataFrame read from the City's CSV and return a
standardized DataFrame where every record has a status (valid or discarded) and, when
discarded, the reason.
"""

import json

import pandas as pd

from app.core.config import CITY_BOUNDS
from app.domain.models import DiscardReason, RoadType, Severity, Status

# Source columns the pipeline relies on. If any is missing, the load stops.
REQUIRED_COLUMNS = [
    "idacidente",
    "data",
    "hora",
    "latitude",
    "longitude",
    "log1",
    "log2",
    "tipo_acid",
    "ups",
    "feridos",
    "mortes",
    "fatais",
    "regiao",
]

# LGPD: the dataset must not carry personal data. If any of these columns shows up, it is dropped.
PERSONAL_COLUMNS = ["nome", "cpf", "rg", "placa", "cnh", "telefone", "endereco_vitima"]

# EPTC's UPS (standard severity unit): 1 no injuries, 5 with injuries, 13 with fatalities.
SEVERITY_BY_UPS = {1: Severity.NO_INJURIES.value, 5: Severity.WITH_INJURIES.value, 13: Severity.WITH_FATALITIES.value}

# Road type from the street prefix the City itself uses (RN-05).
ROAD_TYPE_BY_PREFIX = {
    "AV": RoadType.AVENUE.value,
    "R": RoadType.STREET.value,
    "ESTR": RoadType.ROAD.value,
    "ROD": RoadType.HIGHWAY.value,
    "RS": RoadType.HIGHWAY.value,
    "BR": RoadType.HIGHWAY.value,
}


class MissingColumnsError(ValueError):
    """The file does not have the columns expected in the accident dataset."""

    def __init__(self, missing: list[str]):
        self.missing = missing
        super().__init__("Missing columns in file: " + ", ".join(missing))


def validate_columns(df: pd.DataFrame) -> None:
    """Stops the load if a required column is missing."""
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise MissingColumnsError(missing)


def drop_personal_data(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Drops personal-data columns, if present, and reports which ones were dropped."""
    found = [c for c in df.columns if c.strip().lower() in PERSONAL_COLUMNS]
    return df.drop(columns=found), found


def _number(series: pd.Series) -> pd.Series:
    """Parses text into numbers, accepting a comma as decimal separator."""
    text = series.astype("string").str.strip().str.replace(",", ".", regex=False)
    return pd.to_numeric(text, errors="coerce")


def _time(series: pd.Series) -> pd.Series:
    """Turns '12:30:00.0000000' into '12:30'. Invalid values become null."""
    text = series.astype("string").str.strip().str.slice(0, 5)
    valid = text.str.fullmatch(r"([01]\d|2[0-3]):[0-5]\d").fillna(False).astype(bool)
    return text.where(valid)


def road_type(street: object) -> str:
    """Classifies the road by the street's leading prefix (AV, R, ESTR...)."""
    if not isinstance(street, str) or not street.strip():
        return RoadType.OTHER.value
    prefix = street.strip().split()[0].upper().rstrip(".")
    return ROAD_TYPE_BY_PREFIX.get(prefix, RoadType.OTHER.value)


def _severity(ups: pd.Series, deaths: pd.Series, injured: pd.Series) -> pd.Series:
    """Severity from the UPS; when the UPS is empty or off-standard, falls back to the victim counts."""
    severity = ups.map(SEVERITY_BY_UPS)
    from_counts = pd.Series(Severity.NO_INJURIES.value, index=ups.index)
    from_counts[injured.fillna(0) > 0] = Severity.WITH_INJURIES.value
    from_counts[deaths.fillna(0) > 0] = Severity.WITH_FATALITIES.value
    return severity.fillna(from_counts)


def _text(series: pd.Series) -> pd.Series:
    text = series.astype("string").str.strip()
    return text.where(text != "")


def clean(raw: pd.DataFrame) -> pd.DataFrame:
    """Standardizes the dataset and marks each record as valid or discarded, with a reason.

    The original record is kept as JSON so it can be reprocessed later (Phase 2, F5).
    """
    validate_columns(raw)
    raw, _ = drop_personal_data(raw)
    raw = raw.reset_index(drop=True)

    df = pd.DataFrame(index=raw.index)
    df["source_id"] = _number(raw["idacidente"]).round().astype("Int64")
    df["date"] = pd.to_datetime(raw["data"].astype("string").str.strip(), errors="coerce").dt.normalize()
    df["time"] = _time(raw["hora"])
    df["weekday"] = df["date"].dt.day_of_week.astype("Int64")  # 0 = Monday, 6 = Sunday
    df["latitude"] = _number(raw["latitude"])
    df["longitude"] = _number(raw["longitude"])
    df["street"] = _text(raw["log1"])
    df["cross_street"] = _text(raw["log2"])
    df["road_type"] = df["street"].map(road_type)
    df["accident_type"] = _text(raw["tipo_acid"])
    df["region"] = _text(raw["regiao"])
    injured = _number(raw["feridos"])
    deaths = _number(raw["mortes"]).fillna(0) + _number(raw["fatais"]).fillna(0)
    df["severity"] = _severity(_number(raw["ups"]), deaths, injured)

    # Each record gets the first discard reason that applies to it.
    reason = pd.Series(pd.NA, index=df.index, dtype="string")

    def mark(condition: pd.Series, discard_reason: DiscardReason) -> None:
        reason[condition.fillna(False).astype(bool) & reason.isna()] = discard_reason.value

    mark(df["source_id"].isna(), DiscardReason.INVALID_ID)
    mark(df["source_id"].duplicated(keep="first") & df["source_id"].notna(), DiscardReason.DUPLICATE_ID)
    mark(df["date"].isna(), DiscardReason.INVALID_DATE)
    # An accident cannot have happened after the dataset was extracted (the source has dates like 2029).
    if "data_extracao" in raw.columns:
        extracted = pd.to_datetime(raw["data_extracao"].astype("string").str.strip(), errors="coerce").dt.normalize()
        mark(df["date"] > extracted, DiscardReason.DATE_AFTER_EXTRACTION)
    mark(df["latitude"].isna() | df["longitude"].isna(), DiscardReason.MISSING_COORDINATES)
    outside = (
        (df["latitude"] < CITY_BOUNDS.lat_min)
        | (df["latitude"] > CITY_BOUNDS.lat_max)
        | (df["longitude"] < CITY_BOUNDS.lon_min)
        | (df["longitude"] > CITY_BOUNDS.lon_max)
    )
    mark(outside, DiscardReason.OUTSIDE_CITY)

    df["discard_reason"] = reason
    df["status"] = reason.isna().map({True: Status.VALID.value, False: Status.DISCARDED.value})
    df["raw"] = [
        json.dumps({k: (None if pd.isna(v) else v) for k, v in row.items()}, ensure_ascii=False)
        for row in raw.to_dict(orient="records")
    ]
    return df


def summarize(df: pd.DataFrame) -> dict:
    """Accepted and discarded totals by reason, for the load report."""
    discarded = df[df["status"] == Status.DISCARDED]
    valid = df[df["status"] == Status.VALID]
    return {
        "total_read": int(len(df)),
        "total_accepted": int(len(valid)),
        "total_discarded": int(len(discarded)),
        "discards_by_reason": {k: int(v) for k, v in discarded["discard_reason"].value_counts().items()},
        "accepted_without_time": int(valid["time"].isna().sum()),
    }
