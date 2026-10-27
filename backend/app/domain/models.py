"""Domain vocabulary: record status, discard reasons, severity, road types and the core entities."""

from dataclasses import dataclass
from enum import StrEnum


class Status(StrEnum):
    VALID = "valid"
    DISCARDED = "discarded"


class DiscardReason(StrEnum):
    """Why a record stays off the map, in the order the checks run."""

    INVALID_ID = "invalid_id"
    DUPLICATE_ID = "duplicate_id"
    INVALID_DATE = "invalid_date"
    DATE_AFTER_EXTRACTION = "date_after_extraction"
    MISSING_COORDINATES = "missing_coordinates"
    OUTSIDE_CITY = "outside_city"


class Severity(StrEnum):
    NO_INJURIES = "no_injuries"
    WITH_INJURIES = "with_injuries"
    WITH_FATALITIES = "with_fatalities"


class RoadType(StrEnum):
    AVENUE = "avenue"
    STREET = "street"
    ROAD = "road"
    HIGHWAY = "highway"
    OTHER = "other"


@dataclass(frozen=True)
class DataLoad:
    """One run of the ingestion pipeline."""

    id: int
    source_file: str
    loaded_at: str
    total_read: int
    total_accepted: int
    total_discarded: int
    discards_by_reason: dict[str, int]
    extracted_at: str | None


@dataclass(frozen=True)
class Hotspot:
    """A place with at least N accidents within the radius (RN-01)."""

    id: str
    rank: int
    name: str | None
    latitude: float
    longitude: float
    total: int
    no_injuries: int
    with_injuries: int
    with_fatalities: int
    first_date: str
    last_date: str
    region: str | None
