import pandas as pd
import pytest

from app.domain import cleaning
from tests.factories import source_row


def test_complete_record_is_valid(read_rows) -> None:
    df = cleaning.clean(read_rows([source_row("1000,0")]))

    record = df.iloc[0]
    assert record["status"] == "valid"
    assert pd.isna(record["discard_reason"])
    assert record["source_id"] == 1000
    assert record["date"] == pd.Timestamp("2024-03-02")
    assert record["time"] == "12:30"
    assert record["weekday"] == 5  # Saturday
    assert record["latitude"] == pytest.approx(-30.0346)
    assert record["road_type"] == "avenue"


def test_record_without_coordinates_is_discarded(read_rows) -> None:
    df = cleaning.clean(read_rows([source_row("1", lat="", lon="")]))

    assert df.iloc[0]["status"] == "discarded"
    assert df.iloc[0]["discard_reason"] == "missing_coordinates"


def test_coordinates_outside_porto_alegre_are_discarded(read_rows) -> None:
    # A São Paulo coordinate and a zeroed one.
    df = cleaning.clean(read_rows([source_row("1", lat="-23.55", lon="-46.63"), source_row("2", lat="0", lon="0")]))

    assert df["discard_reason"].tolist() == ["outside_city", "outside_city"]


def test_invalid_date_is_discarded(read_rows) -> None:
    df = cleaning.clean(read_rows([source_row("1", date="2024-13-45"), source_row("2", date="")]))

    assert df["discard_reason"].tolist() == ["invalid_date", "invalid_date"]


def test_date_after_extraction_is_discarded(read_rows) -> None:
    df = cleaning.clean(
        read_rows([source_row("1", date="2029-09-11 00:00:00"), source_row("2", date="2026-09-30 00:00:00")])
    )

    assert df["discard_reason"].tolist()[0] == "date_after_extraction"
    assert df.iloc[1]["status"] == "valid"


def test_duplicate_id_keeps_the_first(read_rows) -> None:
    df = cleaning.clean(read_rows([source_row("7,0"), source_row("7,0")]))

    assert df["status"].tolist() == ["valid", "discarded"]
    assert df.iloc[1]["discard_reason"] == "duplicate_id"


def test_invalid_id_is_discarded(read_rows) -> None:
    df = cleaning.clean(read_rows([source_row("abc")]))

    assert df.iloc[0]["discard_reason"] == "invalid_id"


def test_invalid_time_becomes_null_but_record_stays(read_rows) -> None:
    df = cleaning.clean(read_rows([source_row("1", time=""), source_row("2", time="25:00:00.0000000")]))

    assert df["status"].tolist() == ["valid", "valid"]
    assert df["time"].isna().all()


def test_original_record_is_kept(read_rows) -> None:
    df = cleaning.clean(read_rows([source_row("1", lat="")]))

    assert '"idacidente": "1"' in df.iloc[0]["raw"]


@pytest.mark.parametrize(
    ("ups", "injured", "deaths", "expected"),
    [
        ("1", "0", "0", "no_injuries"),
        ("5", "2", "0", "with_injuries"),
        ("13", "0", "1", "with_fatalities"),
        ("", "1", "0", "with_injuries"),
        ("", "0", "1", "with_fatalities"),
    ],
)
def test_severity(read_rows, ups, injured, deaths, expected) -> None:
    df = cleaning.clean(read_rows([source_row("1", ups=ups, injured=injured, deaths=deaths)]))

    assert df.iloc[0]["severity"] == expected


@pytest.mark.parametrize(
    ("street", "expected"),
    [
        ("AV IPIRANGA", "avenue"),
        ("R DA REPUBLICA", "street"),
        ("ESTR JOAO DE OLIVEIRA REMIAO", "road"),
        ("TUN DA CONCEICAO", "other"),
        ("", "other"),
        (None, "other"),
    ],
)
def test_road_type(street, expected) -> None:
    assert cleaning.road_type(street) == expected


def test_missing_columns_stop_the_load() -> None:
    raw = pd.DataFrame({"data": ["2024-01-01"], "latitude": ["-30"]})

    with pytest.raises(cleaning.MissingColumnsError) as error:
        cleaning.clean(raw)

    assert "idacidente" in error.value.missing


def test_personal_columns_are_dropped(read_rows) -> None:
    raw = read_rows([source_row("1")])
    raw["placa"] = "ABC1D23"

    without_personal, dropped = cleaning.drop_personal_data(raw)

    assert dropped == ["placa"]
    assert "placa" not in without_personal.columns
    assert "ABC1D23" not in cleaning.clean(raw).iloc[0]["raw"]


def test_summary_counts_accepted_and_discarded_by_reason(read_rows) -> None:
    df = cleaning.clean(
        read_rows([source_row("1"), source_row("2", lat=""), source_row("3", lat=""), source_row("4", date="x")])
    )

    summary = cleaning.summarize(df)

    assert summary["total_read"] == 4
    assert summary["total_accepted"] == 1
    assert summary["total_discarded"] == 3
    assert summary["discards_by_reason"] == {"missing_coordinates": 2, "invalid_date": 1}
