"""Dashboard filters (M5, RN-03 and RN-04)."""

from dataclasses import dataclass
from datetime import date

import pandas as pd

from app.domain.models import RoadType

# RN-03: the dashboard opens with the last 5 calendar years of the dataset.
DEFAULT_PERIOD_YEARS = 5

ROAD_TYPES = [road_type.value for road_type in RoadType]


@dataclass(frozen=True)
class AccidentFilters:
    """Slice requested by the visitor. All filters combine with AND (RN-04).

    Time of day: hour_start is inclusive and hour_end exclusive, in whole hours. When the
    start is greater than the end, the range crosses midnight (22 to 2 = 22h, 23h, 0h and 1h).
    """

    start: date | None = None
    end: date | None = None
    hour_start: int | None = None
    hour_end: int | None = None
    weekdays: tuple[int, ...] = ()
    road_types: tuple[str, ...] = ()


def default_period(dates: pd.Series) -> tuple[date, date]:
    """RN-03: last 5 calendar years, counted back from the most recent record."""
    latest = dates.max().date()
    earliest = dates.min().date()
    start = date(latest.year - DEFAULT_PERIOD_YEARS, 1, 1)
    return max(start, earliest), latest


def apply_filters(accidents: pd.DataFrame, filters: AccidentFilters) -> pd.DataFrame:
    """Applies all filters together. Without a time filter, records with no time are kept."""
    if accidents.empty:
        return accidents
    mask = pd.Series(True, index=accidents.index)
    start, end = filters.start, filters.end
    if start is None or end is None:
        default_start, default_end = default_period(accidents["date"])
        start = start or default_start
        end = end or default_end
    mask &= (accidents["date"] >= pd.Timestamp(start)) & (accidents["date"] <= pd.Timestamp(end))

    if filters.hour_start is not None and filters.hour_end is not None and filters.hour_start != filters.hour_end:
        hour = accidents["hour"]
        if filters.hour_start < filters.hour_end:
            mask &= (hour >= filters.hour_start) & (hour < filters.hour_end)
        else:
            mask &= (hour >= filters.hour_start) | (hour < filters.hour_end)
        mask &= hour.notna()

    if filters.weekdays:
        mask &= accidents["weekday"].isin(filters.weekdays)
    if filters.road_types:
        mask &= accidents["road_type"].isin(filters.road_types)
    return accidents[mask]
