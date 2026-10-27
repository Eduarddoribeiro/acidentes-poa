from datetime import date

import pandas as pd

from app.domain.filters import AccidentFilters, apply_filters, default_period


def _accidents() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "date": pd.to_datetime(["2024-03-02", "2024-03-02", "2024-03-03", "2024-03-04", "2019-01-01"]),
            "hour": [22, 1, 23, 12, float("nan")],
            "weekday": [5, 5, 6, 0, 1],
            "road_type": ["avenue", "street", "avenue", "avenue", "street"],
        }
    )


def test_default_period_is_the_last_5_years() -> None:
    dates = pd.Series(pd.to_datetime(["2019-01-01", "2026-09-30"]))

    assert default_period(dates) == (date(2021, 1, 1), date(2026, 9, 30))


def test_time_range_across_midnight_combines_with_weekday() -> None:
    # RN-04: "Saturday, 22h to 2h".
    filters = AccidentFilters(start=date(2024, 1, 1), end=date(2024, 12, 31), hour_start=22, hour_end=2, weekdays=(5,))

    assert apply_filters(_accidents(), filters).index.tolist() == [0, 1]


def test_road_type_and_period() -> None:
    filters = AccidentFilters(start=date(2024, 3, 3), end=date(2024, 12, 31), road_types=("avenue",))

    assert apply_filters(_accidents(), filters).index.tolist() == [2, 3]


def test_without_time_filter_records_without_time_stay() -> None:
    filters = AccidentFilters(start=date(2010, 1, 1), end=date(2030, 1, 1))

    assert len(apply_filters(_accidents(), filters)) == 5
