"""Entry point of the Porto Alegre traffic accidents API."""

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

from app.api.errors import register_exception_handlers
from app.api.frontend import mount_frontend
from app.api.routes import health, heatmap, hotspots, metadata
from app.core.config import FRONTEND_DIST_DIR, Settings
from app.services.dataset import AccidentDataset
from app.services.heatmap_service import HeatmapService
from app.services.hotspot_service import HotspotService
from app.services.metadata_service import MetadataService


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    app = FastAPI(title="Traffic Accidents in Porto Alegre", version="0.3.0")
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    dataset = AccidentDataset(settings.db_path)
    app.state.hotspot_service = HotspotService(dataset, settings.hotspot_radius_m, settings.hotspot_min_accidents)
    app.state.heatmap_service = HeatmapService(dataset)
    app.state.metadata_service = MetadataService(
        dataset, settings.hotspot_radius_m, settings.hotspot_min_accidents
    )

    register_exception_handlers(app)
    for module in (health, metadata, hotspots, heatmap):
        app.include_router(module.router)
    # Registered last: its catch-all route must not shadow the API.
    mount_frontend(app, FRONTEND_DIST_DIR)
    return app


app = create_app()
