from app.core.config import SOURCE_NAME, SOURCE_PAGE_URL
from app.domain.filters import default_period
from app.domain.models import DiscardReason
from app.services.dataset import AccidentDataset


def _percent(part: int, whole: int) -> float:
    return round(100 * part / whole, 1) if whole else 0


class MetadataService:
    """Source, period, criteria and discards, for the methodology page and the filters."""

    def __init__(self, dataset: AccidentDataset, radius_m: int, min_accidents: int) -> None:
        self._dataset = dataset
        self._radius_m = radius_m
        self._min_accidents = min_accidents

    def metadata(self) -> dict:
        snapshot = self._dataset.current()
        load, accidents = snapshot.load, snapshot.accidents
        start, end = default_period(accidents["date"])
        missing_coordinates = load.discards_by_reason.get(DiscardReason.MISSING_COORDINATES.value, 0)
        return {
            "source": {"name": SOURCE_NAME, "url": SOURCE_PAGE_URL},
            "load": {
                "loaded_at": load.loaded_at,
                "extracted_at": load.extracted_at,
                "total_read": load.total_read,
                "total_accepted": load.total_accepted,
                "total_discarded": load.total_discarded,
                "discards_by_reason": load.discards_by_reason,
                "percent_off_map": _percent(load.total_discarded, load.total_read),
                "percent_missing_coordinates": _percent(missing_coordinates, load.total_read),
            },
            "dataset_period": {"start": accidents["date"].min().date(), "end": accidents["date"].max().date()},
            "default_period": {"start": start, "end": end},
            "criteria": {"radius_meters": self._radius_m, "min_accidents": self._min_accidents},
            "road_types": {k: int(v) for k, v in accidents["road_type"].value_counts().items()},
        }
