"""Cálculo de pontos críticos por raio (M3, RN-01).

Algoritmo guloso: o acidente com mais vizinhos num raio de R metros vira centro de um
ponto crítico, e ele e seus vizinhos saem da disputa. Repete enquanto o próximo centro
tiver N ou mais acidentes no raio. Assim cada acidente conta em um único ponto, e a
ordem da lista é a ordem real de concentração.
"""

import heapq
import numpy as np
import pandas as pd

METROS_POR_GRAU_LAT = 110_540
METROS_POR_GRAU_LON_EQUADOR = 111_320

SIGLAS = {"AV": "Av.", "R": "R.", "ESTR": "Estr.", "TRAV": "Trav.", "PCA": "Pça.", "AL": "Al.", "LG": "Lgo."}
MINUSCULAS = {"DA", "DE", "DO", "DAS", "DOS", "E"}
SEM_NOME = "Local sem nome na base"


def projetar(lat: np.ndarray, lon: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Converte graus em metros num plano local. O erro é desprezível na escala de uma cidade."""
    lat0 = float(np.mean(lat)) if len(lat) else 0.0
    x = (lon - float(np.mean(lon) if len(lon) else 0.0)) * METROS_POR_GRAU_LON_EQUADOR * np.cos(np.radians(lat0))
    y = (lat - lat0) * METROS_POR_GRAU_LAT
    return x, y


def vizinhos(x: np.ndarray, y: np.ndarray, raio: float) -> list[np.ndarray]:
    """Para cada ponto, os índices dos pontos a até `raio` metros (inclui o próprio ponto).

    Usa uma grade com células do tamanho do raio: só as 9 células em volta são comparadas.
    """
    n = len(x)
    if n == 0:
        return []
    cx = np.floor(x / raio).astype(np.int64)
    cy = np.floor(y / raio).astype(np.int64)
    celulas: dict[tuple[int, int], np.ndarray] = {}
    ordem = np.lexsort((cy, cx))
    chaves = np.stack([cx[ordem], cy[ordem]], axis=1)
    quebras = np.flatnonzero(np.any(np.diff(chaves, axis=0) != 0, axis=1)) + 1
    for grupo in np.split(ordem, quebras):
        celulas[(int(cx[grupo[0]]), int(cy[grupo[0]]))] = grupo

    raio2 = raio * raio
    origens, destinos = [], []
    for (i, j), membros in celulas.items():
        candidatos = [celulas[(i + di, j + dj)] for di in (-1, 0, 1) for dj in (-1, 0, 1) if (i + di, j + dj) in celulas]
        cand = np.concatenate(candidatos)
        dx = x[membros][:, None] - x[cand][None, :]
        dy = y[membros][:, None] - y[cand][None, :]
        linhas, colunas = np.nonzero((dx * dx + dy * dy) <= raio2)
        origens.append(membros[linhas])
        destinos.append(cand[colunas])
    origem = np.concatenate(origens)
    destino = np.concatenate(destinos)
    ordem_pares = np.argsort(origem, kind="stable")
    cortes = np.cumsum(np.bincount(origem, minlength=n))[:-1]
    return np.split(destino[ordem_pares], cortes)


def agrupar(lat: np.ndarray, lon: np.ndarray, raio: float, minimo: int) -> list[np.ndarray]:
    """Devolve os grupos (índices dos acidentes) com `minimo` ou mais acidentes no raio, do maior para o menor."""
    x, y = projetar(np.asarray(lat, dtype=float), np.asarray(lon, dtype=float))
    viz = vizinhos(x, y, raio)
    livre = np.ones(len(x), dtype=bool)
    fila = [(-len(v), i) for i, v in enumerate(viz) if len(v) >= minimo]
    heapq.heapify(fila)
    grupos: list[np.ndarray] = []
    while fila:
        negativo, i = heapq.heappop(fila)
        if not livre[i]:
            continue
        membros = viz[i][livre[viz[i]]]
        if len(membros) < minimo:
            continue
        if len(membros) != -negativo:
            # A contagem mudou porque vizinhos entraram em outro ponto. Volta para a fila.
            heapq.heappush(fila, (-len(membros), i))
            continue
        livre[membros] = False
        grupos.append(membros)
    return grupos


def formatar_logradouro(nome: object) -> str | None:
    """'AV BORGES DE MEDEIROS' vira 'Av. Borges de Medeiros'."""
    if not isinstance(nome, str) or not nome.strip():
        return None
    palavras = nome.strip().upper().split()
    saida = []
    for posicao, palavra in enumerate(palavras):
        if posicao == 0 and palavra in SIGLAS:
            saida.append(SIGLAS[palavra])
        elif posicao > 0 and palavra in MINUSCULAS:
            saida.append(palavra.lower())
        else:
            saida.append(palavra.capitalize())
    return " ".join(saida)


def _locais(acidentes: pd.DataFrame) -> pd.Series:
    """Nome de cada acidente: cruzamento ('Av. A × R. B', em ordem alfabética) ou só o logradouro."""
    nomes = {v: formatar_logradouro(v) for v in pd.unique(pd.concat([acidentes["log1"], acidentes["log2"]]))}
    a = acidentes["log1"].map(nomes)
    b = acidentes["log2"].map(nomes)
    cruzamento = a.notna() & b.notna() & (a != b)
    menor = a.where(a.fillna("") <= b.fillna(""), b)
    maior = b.where(a.fillna("") <= b.fillna(""), a)
    return (menor + " × " + maior).where(cruzamento, a.where(a.notna(), b))


def calcular(acidentes: pd.DataFrame, raio: float, minimo: int) -> list[dict]:
    """Pontos críticos de um conjunto de acidentes válidos, já ordenados e numerados."""
    if acidentes.empty:
        return []
    acidentes = acidentes.reset_index(drop=True)
    grupos = agrupar(acidentes["latitude"].to_numpy(), acidentes["longitude"].to_numpy(), raio, minimo)
    if not grupos:
        return []
    rotulo = np.full(len(acidentes), -1)
    for numero, membros in enumerate(grupos):
        rotulo[membros] = numero
    dentro = rotulo >= 0
    df = acidentes.loc[dentro, ["latitude", "longitude", "data", "regiao", "gravidade"]].copy()
    df["grupo"] = rotulo[dentro]
    df["local"] = _locais(acidentes.loc[dentro])

    resumo = df.groupby("grupo").agg(
        latitude=("latitude", "mean"),
        longitude=("longitude", "mean"),
        total=("latitude", "size"),
        data_inicio=("data", "min"),
        data_fim=("data", "max"),
    )
    gravidade = pd.crosstab(df["grupo"], df["gravidade"])
    # Nome mais frequente no grupo; empate fica com o primeiro em ordem alfabética.
    nomes = (
        df.dropna(subset=["local"])
        .groupby(["grupo", "local"])
        .size()
        .reset_index(name="n")
        .sort_values(["grupo", "n", "local"], ascending=[True, False, True])
        .drop_duplicates("grupo")
        .set_index("grupo")["local"]
    )
    regioes = (
        df.dropna(subset=["regiao"])
        .groupby(["grupo", "regiao"])
        .size()
        .reset_index(name="n")
        .sort_values(["grupo", "n", "regiao"], ascending=[True, False, True])
        .drop_duplicates("grupo")
        .set_index("grupo")["regiao"]
    )

    gravidade = gravidade.to_dict(orient="index")
    nomes = nomes.to_dict()
    regioes = regioes.to_dict()
    pontos = []
    for linha in resumo.itertuples():
        numero = linha.Index
        lat, lon = float(linha.latitude), float(linha.longitude)
        contagem = gravidade.get(numero, {})
        pontos.append(
            {
                "id": f"{lat:.5f},{lon:.5f}",
                "nome": nomes.get(numero, SEM_NOME),
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "total": int(linha.total),
                "sem_vitimas": int(contagem.get("sem_vitimas", 0)),
                "com_feridos": int(contagem.get("com_feridos", 0)),
                "com_mortos": int(contagem.get("com_mortos", 0)),
                "data_inicio": linha.data_inicio.strftime("%Y-%m-%d"),
                "data_fim": linha.data_fim.strftime("%Y-%m-%d"),
                "regiao": regioes.get(numero),
            }
        )
    # Desempate estável: mais acidentes primeiro, depois nome.
    pontos.sort(key=lambda p: (-p["total"], p["nome"]))
    for posicao, ponto in enumerate(pontos, start=1):
        ponto["posicao"] = posicao
    return pontos
