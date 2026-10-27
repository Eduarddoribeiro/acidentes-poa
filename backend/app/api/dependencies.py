"""Dependencies injected into the routes: services and the parsed filters."""

from datetime import date
from typing import Annotated

from fastapi import Depends, HTTPException, Query, Request

from app.domain.filters import ROAD_TYPES, AccidentFilters
from app.services.heatmap_service import HeatmapService
from app.services.hotspot_service import HotspotService
from app.services.metadata_service import MetadataService

WEEKDAYS_ERROR = "Weekdays must be numbers from 0 (Monday) to 6 (Sunday)."


def get_hotspot_service(request: Request) -> HotspotService:
    return request.app.state.hotspot_service


def get_heatmap_service(request: Request) -> HeatmapService:
    return request.app.state.heatmap_service


def get_metadata_service(request: Request) -> MetadataService:
    return request.app.state.metadata_service


def _split(value: str | None) -> list[str]:
    return [item for item in value.split(",") if item] if value else []


def get_filters(
    start: Annotated[date | None, Query(description="Start date (YYYY-MM-DD)")] = None,
    end: Annotated[date | None, Query(description="End date (YYYY-MM-DD)")] = None,
    hour_start: Annotated[int | None, Query(ge=0, le=23, description="Start hour, inclusive")] = None,
    hour_end: Annotated[int | None, Query(ge=0, le=24, description="End hour, exclusive")] = None,
    weekdays: Annotated[str | None, Query(description="Comma-separated weekdays, 0 = Monday")] = None,
    road_types: Annotated[str | None, Query(description="Comma-separated road types")] = None,
) -> AccidentFilters:
    try:
        weekday_list = tuple(sorted({int(d) for d in _split(weekdays)}))
    except ValueError:
        raise HTTPException(422, WEEKDAYS_ERROR)
    if any(d < 0 or d > 6 for d in weekday_list):
        raise HTTPException(422, WEEKDAYS_ERROR)
    road_type_list = tuple(sorted(set(_split(road_types))))
    unknown = [r for r in road_type_list if r not in ROAD_TYPES]
    if unknown:
        raise HTTPException(422, f"Unknown road type: {', '.join(unknown)}.")
    return AccidentFilters(start, end, hour_start, hour_end, weekday_list, road_type_list)


Filters = Annotated[AccidentFilters, Depends(get_filters)]
