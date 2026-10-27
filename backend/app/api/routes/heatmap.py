from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import Filters, get_heatmap_service
from app.api.schemas import Heatmap
from app.services.heatmap_service import Heatmap as HeatmapResult
from app.services.heatmap_service import HeatmapService

router = APIRouter(prefix="/api", tags=["heatmap"])


@router.get("/heatmap", response_model=Heatmap)
def heatmap(filters: Filters, service: Annotated[HeatmapService, Depends(get_heatmap_service)]) -> HeatmapResult:
    """Heatmap points of the slice: [latitude, longitude, count]."""
    return service.heatmap(filters)
