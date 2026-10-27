from dataclasses import dataclass

from app.domain.filters import AccidentFilters, apply_filters
from app.domain.heatmap import heatmap_cells
from app.services.dataset import AccidentDataset


@dataclass(frozen=True)
class Heatmap:
    total: int
    points: list[tuple[float, float, int]]


class HeatmapService:
    def __init__(self, dataset: AccidentDataset) -> None:
        self._dataset = dataset

    def heatmap(self, filters: AccidentFilters) -> Heatmap:
        accidents = apply_filters(self._dataset.current().accidents, filters)
        return Heatmap(total=int(len(accidents)), points=heatmap_cells(accidents))
