"""Ponto de entrada da API de acidentes de trânsito em Porto Alegre."""

from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Annotated

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import banco, config, consultas, pontos_criticos

app = FastAPI(
    title="Acidentes de Trânsito em Porto Alegre",
    version="0.2.0",
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


class Base:
    """Acidentes válidos em memória. Recarrega quando o banco recebe uma nova carga."""

    def __init__(self) -> None:
        self.carga: dict | None = None
        self.acidentes = pd.DataFrame()

    def atual(self) -> tuple[dict, pd.DataFrame]:
        caminho = Path(config.CAMINHO_BANCO)
        if not caminho.exists():
            raise HTTPException(503, "A base ainda não foi carregada. Rode python -m app.ingestao --baixar.")
        conn = banco.conectar(caminho)
        try:
            carga = banco.ultima_carga(conn)
            if carga is None:
                raise HTTPException(503, "A base ainda não foi carregada. Rode python -m app.ingestao --baixar.")
            if self.carga is None or self.carga["id"] != carga["id"]:
                self.acidentes = banco.ler_validos(conn)
                self.carga = carga
                _pontos.cache_clear()
        finally:
            conn.close()
        return self.carga, self.acidentes


base = Base()


def _filtros(
    inicio: date | None,
    fim: date | None,
    hora_inicio: int | None,
    hora_fim: int | None,
    dias: str | None,
    vias: str | None,
) -> consultas.Filtros:
    try:
        lista_dias = tuple(sorted({int(d) for d in dias.split(",") if d != ""})) if dias else ()
    except ValueError:
        raise HTTPException(422, "Dias da semana devem ser números de 0 (segunda) a 6 (domingo).")
    if any(d < 0 or d > 6 for d in lista_dias):
        raise HTTPException(422, "Dias da semana devem ser números de 0 (segunda) a 6 (domingo).")
    lista_vias = tuple(sorted({v for v in vias.split(",") if v})) if vias else ()
    invalidas = [v for v in lista_vias if v not in consultas.TIPOS_VIA]
    if invalidas:
        raise HTTPException(422, f"Tipo de via desconhecido: {', '.join(invalidas)}.")
    return consultas.Filtros(inicio, fim, hora_inicio, hora_fim, lista_dias, lista_vias)


Inicio = Annotated[date | None, Query(description="Data inicial (AAAA-MM-DD)")]
Fim = Annotated[date | None, Query(description="Data final (AAAA-MM-DD)")]
HoraInicio = Annotated[int | None, Query(ge=0, le=23, description="Hora inicial, inclusiva")]
HoraFim = Annotated[int | None, Query(ge=0, le=24, description="Hora final, exclusiva")]
Dias = Annotated[str | None, Query(description="Dias da semana separados por vírgula, 0 = segunda")]
Vias = Annotated[str | None, Query(description="Tipos de via separados por vírgula")]


@lru_cache(maxsize=256)
def _pontos(carga_id: int, filtros: consultas.Filtros) -> list[dict]:
    _, acidentes = base.atual()
    recorte = consultas.aplicar(acidentes, filtros)
    return pontos_criticos.calcular(recorte, config.RAIO_METROS, config.N_MINIMO)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Confirma que a API está no ar."""
    return {"status": "ok"}


@app.get("/api/meta")
def meta() -> dict:
    """Fonte, período, critério e descartes, para a página de metodologia e os filtros."""
    carga, acidentes = base.atual()
    inicio, fim = consultas.periodo_padrao(acidentes["data"])
    sem_coordenada = carga["descartes_por_motivo"].get("sem_coordenada", 0)
    return {
        "fonte": {"nome": "#DataPoa / EPTC", "url": config.URL_PAGINA_BASE},
        "carga": {
            "data_carga": carga["data_carga"],
            "data_extracao": carga["data_extracao"],
            "total_lido": carga["total_lido"],
            "total_aceito": carga["total_aceito"],
            "total_descartado": carga["total_descartado"],
            "descartes_por_motivo": carga["descartes_por_motivo"],
            "percentual_fora_do_mapa": round(100 * carga["total_descartado"] / carga["total_lido"], 1)
            if carga["total_lido"]
            else 0,
            "percentual_sem_coordenada": round(100 * sem_coordenada / carga["total_lido"], 1)
            if carga["total_lido"]
            else 0,
        },
        "periodo_base": {
            "inicio": acidentes["data"].min().strftime("%Y-%m-%d"),
            "fim": acidentes["data"].max().strftime("%Y-%m-%d"),
        },
        "periodo_padrao": {"inicio": inicio.isoformat(), "fim": fim.isoformat()},
        "criterio": {"raio_metros": config.RAIO_METROS, "n_minimo": config.N_MINIMO},
        "tipos_via": {v: int(n) for v, n in acidentes["tipo_via"].value_counts().items()},
    }


@app.get("/api/calor")
def calor(
    inicio: Inicio = None,
    fim: Fim = None,
    hora_inicio: HoraInicio = None,
    hora_fim: HoraFim = None,
    dias: Dias = None,
    vias: Vias = None,
) -> dict:
    """Pontos do mapa de calor no recorte pedido: [latitude, longitude, quantidade]."""
    _, acidentes = base.atual()
    filtros = _filtros(inicio, fim, hora_inicio, hora_fim, dias, vias)
    recorte = consultas.aplicar(acidentes, filtros)
    return {"total": int(len(recorte)), "pontos": consultas.calor(recorte)}


@app.get("/api/pontos-criticos")
def pontos(
    inicio: Inicio = None,
    fim: Fim = None,
    hora_inicio: HoraInicio = None,
    hora_fim: HoraFim = None,
    dias: Dias = None,
    vias: Vias = None,
) -> dict:
    """Pontos críticos do recorte (RN-01), do maior para o menor número de acidentes."""
    carga, _ = base.atual()
    filtros = _filtros(inicio, fim, hora_inicio, hora_fim, dias, vias)
    lista = _pontos(carga["id"], filtros)
    return {"raio_metros": config.RAIO_METROS, "n_minimo": config.N_MINIMO, "pontos": lista}


# Em produção, a própria API serve o front já compilado (frontend/dist).
PASTA_FRONT = config.RAIZ / "frontend" / "dist"
if PASTA_FRONT.exists():
    app.mount("/assets", StaticFiles(directory=PASTA_FRONT / "assets"), name="assets")

    @app.get("/{caminho:path}", include_in_schema=False)
    def front(caminho: str) -> FileResponse:
        if caminho.startswith("api/"):
            raise HTTPException(404, "Rota não encontrada.")
        arquivo = PASTA_FRONT / caminho
        if caminho and arquivo.is_file() and PASTA_FRONT in arquivo.resolve().parents:
            return FileResponse(arquivo)
        return FileResponse(PASTA_FRONT / "index.html")
