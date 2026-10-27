"""Filtros do painel (M5, RN-03 e RN-04) e respostas da API."""

from dataclasses import dataclass
from datetime import date

import pandas as pd

from app.config import ANOS_PERIODO_PADRAO

TIPOS_VIA = ["avenida", "rua", "estrada", "rodovia", "outra"]


@dataclass(frozen=True)
class Filtros:
    """Recorte pedido pelo visitante. Todos os filtros combinam entre si (E, RN-04).

    Horário: hora_inicio inclusiva e hora_fim exclusiva, em horas cheias. Se o início for
    maior que o fim, o intervalo passa da meia-noite (22 a 2 = 22h, 23h, 0h e 1h).
    """

    inicio: date | None = None
    fim: date | None = None
    hora_inicio: int | None = None
    hora_fim: int | None = None
    dias: tuple[int, ...] = ()
    vias: tuple[str, ...] = ()


def periodo_padrao(datas: pd.Series) -> tuple[date, date]:
    """RN-03: últimos 5 anos da base, contados em anos civis a partir do registro mais recente."""
    mais_recente = datas.max().date()
    mais_antigo = datas.min().date()
    inicio = date(mais_recente.year - ANOS_PERIODO_PADRAO, 1, 1)
    return max(inicio, mais_antigo), mais_recente


def aplicar(acidentes: pd.DataFrame, filtros: Filtros) -> pd.DataFrame:
    """Aplica os filtros em conjunto. Sem filtro de horário, registros sem hora continuam."""
    if acidentes.empty:
        return acidentes
    mascara = pd.Series(True, index=acidentes.index)
    inicio, fim = filtros.inicio, filtros.fim
    if inicio is None or fim is None:
        padrao_inicio, padrao_fim = periodo_padrao(acidentes["data"])
        inicio = inicio or padrao_inicio
        fim = fim or padrao_fim
    mascara &= (acidentes["data"] >= pd.Timestamp(inicio)) & (acidentes["data"] <= pd.Timestamp(fim))

    if filtros.hora_inicio is not None and filtros.hora_fim is not None and filtros.hora_inicio != filtros.hora_fim:
        hora = acidentes["hora_num"]
        if filtros.hora_inicio < filtros.hora_fim:
            mascara &= (hora >= filtros.hora_inicio) & (hora < filtros.hora_fim)
        else:
            mascara &= (hora >= filtros.hora_inicio) | (hora < filtros.hora_fim)
        mascara &= hora.notna()

    if filtros.dias:
        mascara &= acidentes["dia_semana"].isin(filtros.dias)
    if filtros.vias:
        mascara &= acidentes["tipo_via"].isin(filtros.vias)
    return acidentes[mascara]


def calor(acidentes: pd.DataFrame, casas: int = 4) -> list[list[float]]:
    """Pontos para o mapa de calor, agregados em células de cerca de 10 m para aliviar a resposta.

    Cada item é [latitude, longitude, quantidade].
    """
    if acidentes.empty:
        return []
    celulas = (
        pd.DataFrame({"lat": acidentes["latitude"].round(casas), "lon": acidentes["longitude"].round(casas)})
        .value_counts()
        .reset_index(name="n")
    )
    return celulas[["lat", "lon", "n"]].values.tolist()
