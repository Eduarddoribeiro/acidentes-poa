from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.services.dataset import DatasetNotLoadedError


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DatasetNotLoadedError)
    def dataset_not_loaded(_: Request, error: DatasetNotLoadedError) -> JSONResponse:
        # 503: the API is up, but the first load has not finished (see docker-entrypoint.sh).
        return JSONResponse(status_code=503, content={"detail": str(error)})
