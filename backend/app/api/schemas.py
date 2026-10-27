"""Response models of the API. They also document the contract in /docs."""

from datetime import date

from pydantic import BaseModel


class Health(BaseModel):
    status: str


class Source(BaseModel):
    name: str
    url: str


class LoadSummary(BaseModel):
    loaded_at: str
    extracted_at: date | None
    total_read: int
    total_accepted: int
    total_discarded: int
    discards_by_reason: dict[str, int]
    percent_off_map: float
    percent_missing_coordinates: float


class Period(BaseModel):
    start: date
    end: date


class Criteria(BaseModel):
    radius_meters: int
    min_accidents: int


class Metadata(BaseModel):
    source: Source
    load: LoadSummary
    dataset_period: Period
    default_period: Period
    criteria: Criteria
    road_types: dict[str, int]


class Hotspot(BaseModel):
    id: str
    rank: int
    name: str | None
    latitude: float
    longitude: float
    total: int
    no_injuries: int
    with_injuries: int
    with_fatalities: int
    first_date: date
    last_date: date
    region: str | None


class HotspotList(BaseModel):
    radius_meters: int
    min_accidents: int
    hotspots: list[Hotspot]


class Heatmap(BaseModel):
    """Each point is [latitude, longitude, count]."""

    total: int
    points: list[tuple[float, float, int]]
