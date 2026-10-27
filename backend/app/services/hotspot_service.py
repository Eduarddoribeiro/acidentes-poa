from functools import lru_cache

from app.domain.filters import AccidentFilters, apply_filters
from app.domain.hotspots import compute_hotspots
from app.domain.models import Hotspot
from app.services.dataset import AccidentDataset


class HotspotService:
    """Hotspots of a filtered slice, cached per load and filter combination.

    The first computation for a slice takes about 1.6 s on the full dataset (section 10 of the scope).
    """

    def __init__(self, dataset: AccidentDataset, radius_m: int, min_accidents: int, cache_size: int = 256) -> None:
        self._dataset = dataset
        self.radius_m = radius_m
        self.min_accidents = min_accidents
        self._cached = lru_cache(maxsize=cache_size)(self._compute)

    def hotspots(self, filters: AccidentFilters) -> list[Hotspot]:
        return self._cached(self._dataset.current().load.id, filters)

    def _compute(self, load_id: int, filters: AccidentFilters) -> list[Hotspot]:
        accidents = apply_filters(self._dataset.current().accidents, filters)
        return compute_hotspots(accidents, self.radius_m, self.min_accidents)
