"""Hotspots by radius (M3, RN-01).

Greedy algorithm: the accident with the most neighbors within R meters becomes the center
of a hotspot, and it and its neighbors leave the pool. This repeats while the next center
has N or more accidents within the radius. Each accident counts in a single hotspot, and
the order of the list is the real order of concentration.
"""

import heapq

import numpy as np
import pandas as pd

from app.domain.models import Hotspot, Severity

METERS_PER_DEGREE_LAT = 110_540
METERS_PER_DEGREE_LON_AT_EQUATOR = 111_320

# Street prefixes and connectors as the City writes them, used to format place names.
STREET_PREFIXES = {"AV": "Av.", "R": "R.", "ESTR": "Estr.", "TRAV": "Trav.", "PCA": "Pça.", "AL": "Al.", "LG": "Lgo."}
LOWERCASE_WORDS = {"DA", "DE", "DO", "DAS", "DOS", "E"}


def project_to_meters(lat: np.ndarray, lon: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Converts degrees into meters on a local plane. The error is negligible at city scale."""
    lat0 = float(np.mean(lat)) if len(lat) else 0.0
    lon0 = float(np.mean(lon)) if len(lon) else 0.0
    x = (lon - lon0) * METERS_PER_DEGREE_LON_AT_EQUATOR * np.cos(np.radians(lat0))
    y = (lat - lat0) * METERS_PER_DEGREE_LAT
    return x, y


def find_neighbors(x: np.ndarray, y: np.ndarray, radius: float) -> list[np.ndarray]:
    """For each point, the indices of the points up to `radius` meters away (itself included).

    Uses a grid with cells the size of the radius, so only the 9 surrounding cells are compared.
    """
    n = len(x)
    if n == 0:
        return []
    cx = np.floor(x / radius).astype(np.int64)
    cy = np.floor(y / radius).astype(np.int64)
    cells: dict[tuple[int, int], np.ndarray] = {}
    order = np.lexsort((cy, cx))
    keys = np.stack([cx[order], cy[order]], axis=1)
    breaks = np.flatnonzero(np.any(np.diff(keys, axis=0) != 0, axis=1)) + 1
    for group in np.split(order, breaks):
        cells[(int(cx[group[0]]), int(cy[group[0]]))] = group

    radius2 = radius * radius
    sources, targets = [], []
    for (i, j), members in cells.items():
        nearby = [cells[(i + di, j + dj)] for di in (-1, 0, 1) for dj in (-1, 0, 1) if (i + di, j + dj) in cells]
        candidates = np.concatenate(nearby)
        dx = x[members][:, None] - x[candidates][None, :]
        dy = y[members][:, None] - y[candidates][None, :]
        rows, cols = np.nonzero((dx * dx + dy * dy) <= radius2)
        sources.append(members[rows])
        targets.append(candidates[cols])
    source = np.concatenate(sources)
    target = np.concatenate(targets)
    pair_order = np.argsort(source, kind="stable")
    cuts = np.cumsum(np.bincount(source, minlength=n))[:-1]
    return np.split(target[pair_order], cuts)


def cluster(lat: np.ndarray, lon: np.ndarray, radius: float, min_accidents: int) -> list[np.ndarray]:
    """Groups (accident indices) with `min_accidents` or more within the radius, largest first."""
    x, y = project_to_meters(np.asarray(lat, dtype=float), np.asarray(lon, dtype=float))
    neighbors = find_neighbors(x, y, radius)
    free = np.ones(len(x), dtype=bool)
    queue = [(-len(v), i) for i, v in enumerate(neighbors) if len(v) >= min_accidents]
    heapq.heapify(queue)
    groups: list[np.ndarray] = []
    while queue:
        negative_count, i = heapq.heappop(queue)
        if not free[i]:
            continue
        members = neighbors[i][free[neighbors[i]]]
        if len(members) < min_accidents:
            continue
        if len(members) != -negative_count:
            # The count changed because neighbors joined another hotspot. Back to the queue.
            heapq.heappush(queue, (-len(members), i))
            continue
        free[members] = False
        groups.append(members)
    return groups


def format_street_name(name: object) -> str | None:
    """'AV BORGES DE MEDEIROS' becomes 'Av. Borges de Medeiros'."""
    if not isinstance(name, str) or not name.strip():
        return None
    words = name.strip().upper().split()
    formatted = []
    for position, word in enumerate(words):
        if position == 0 and word in STREET_PREFIXES:
            formatted.append(STREET_PREFIXES[word])
        elif position > 0 and word in LOWERCASE_WORDS:
            formatted.append(word.lower())
        else:
            formatted.append(word.capitalize())
    return " ".join(formatted)


def _place_names(accidents: pd.DataFrame) -> pd.Series:
    """Name of each accident's place: an intersection ('Av. A × R. B', alphabetical) or a single street."""
    names = {
        v: format_street_name(v) for v in pd.unique(pd.concat([accidents["street"], accidents["cross_street"]]))
    }
    a = accidents["street"].map(names)
    b = accidents["cross_street"].map(names)
    intersection = a.notna() & b.notna() & (a != b)
    first = a.where(a.fillna("") <= b.fillna(""), b)
    second = b.where(a.fillna("") <= b.fillna(""), a)
    return (first + " × " + second).where(intersection, a.where(a.notna(), b))


def _most_frequent(df: pd.DataFrame, column: str) -> dict[int, str]:
    """Most frequent value per group; ties go to the first in alphabetical order."""
    return (
        df.dropna(subset=[column])
        .groupby(["group", column])
        .size()
        .reset_index(name="count")
        .sort_values(["group", "count", column], ascending=[True, False, True])
        .drop_duplicates("group")
        .set_index("group")[column]
        .to_dict()
    )


def compute_hotspots(accidents: pd.DataFrame, radius: float, min_accidents: int) -> list[Hotspot]:
    """Hotspots of a set of valid accidents, sorted and ranked."""
    if accidents.empty:
        return []
    accidents = accidents.reset_index(drop=True)
    groups = cluster(accidents["latitude"].to_numpy(), accidents["longitude"].to_numpy(), radius, min_accidents)
    if not groups:
        return []
    label = np.full(len(accidents), -1)
    for number, members in enumerate(groups):
        label[members] = number
    inside = label >= 0
    df = accidents.loc[inside, ["latitude", "longitude", "date", "region", "severity"]].copy()
    df["group"] = label[inside]
    df["place"] = _place_names(accidents.loc[inside])

    summary = df.groupby("group").agg(
        latitude=("latitude", "mean"),
        longitude=("longitude", "mean"),
        total=("latitude", "size"),
        first_date=("date", "min"),
        last_date=("date", "max"),
    )
    severity = pd.crosstab(df["group"], df["severity"]).to_dict(orient="index")
    names = _most_frequent(df, "place")
    regions = _most_frequent(df, "region")

    rows = []
    for row in summary.itertuples():
        group = row.Index
        lat, lon = float(row.latitude), float(row.longitude)
        counts = severity.get(group, {})
        rows.append(
            {
                "id": f"{lat:.5f},{lon:.5f}",
                "name": names.get(group),
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "total": int(row.total),
                "no_injuries": int(counts.get(Severity.NO_INJURIES.value, 0)),
                "with_injuries": int(counts.get(Severity.WITH_INJURIES.value, 0)),
                "with_fatalities": int(counts.get(Severity.WITH_FATALITIES.value, 0)),
                "first_date": row.first_date.strftime("%Y-%m-%d"),
                "last_date": row.last_date.strftime("%Y-%m-%d"),
                "region": regions.get(group),
            }
        )
    # Stable tie-break: more accidents first, then name (unnamed places last).
    rows.sort(key=lambda h: (-h["total"], h["name"] is None, h["name"] or ""))
    return [Hotspot(rank=rank, **row) for rank, row in enumerate(rows, start=1)]
