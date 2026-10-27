from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_metadata_service
from app.api.schemas import Metadata
from app.services.metadata_service import MetadataService

router = APIRouter(prefix="/api", tags=["metadata"])


@router.get("/metadata", response_model=Metadata)
def metadata(service: Annotated[MetadataService, Depends(get_metadata_service)]) -> dict:
    """Source, period, criteria, discards and road types, for the methodology page and the filters."""
    return service.metadata()
