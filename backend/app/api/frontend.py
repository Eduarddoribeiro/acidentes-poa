from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


def mount_frontend(app: FastAPI, dist_dir: Path) -> None:
    """In production the API itself serves the built front end (frontend/dist)."""
    if not dist_dir.exists():
        return
    app.mount("/assets", StaticFiles(directory=dist_dir / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str) -> FileResponse:
        if path.startswith("api/"):
            raise HTTPException(404, "Route not found.")
        file = dist_dir / path
        if path and file.is_file() and dist_dir in file.resolve().parents:
            return FileResponse(file)
        return FileResponse(dist_dir / "index.html")
