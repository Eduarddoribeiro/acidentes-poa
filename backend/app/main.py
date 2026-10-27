"""Ponto de entrada da API de acidentes de trânsito em Porto Alegre."""

from fastapi import FastAPI

app = FastAPI(
    title="Acidentes de Trânsito em Porto Alegre",
    version="0.1.0",
)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Confirma que a API está no ar."""
    return {"status": "ok"}
