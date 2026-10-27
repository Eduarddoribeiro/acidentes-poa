"""Acesso ao banco SQLite: criação das tabelas, gravação de cargas e leitura dos acidentes."""

import json
import sqlite3
from pathlib import Path

import pandas as pd

ESQUEMA = """
CREATE TABLE IF NOT EXISTS carga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    arquivo_origem TEXT NOT NULL,
    data_carga TEXT NOT NULL,
    total_lido INTEGER NOT NULL,
    total_aceito INTEGER NOT NULL,
    total_descartado INTEGER NOT NULL,
    descartes_por_motivo TEXT NOT NULL,
    data_extracao TEXT
);

CREATE TABLE IF NOT EXISTS acidente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carga_id INTEGER NOT NULL REFERENCES carga(id),
    id_origem INTEGER,
    data TEXT,
    hora TEXT,
    dia_semana INTEGER,
    latitude REAL,
    longitude REAL,
    log1 TEXT,
    log2 TEXT,
    tipo_via TEXT,
    tipo_acidente TEXT,
    regiao TEXT,
    gravidade TEXT,
    origem_arquivo TEXT NOT NULL,
    status TEXT NOT NULL,
    motivo_descarte TEXT,
    original TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_acidente_status ON acidente(status);
"""

COLUNAS_ACIDENTE = [
    "id_origem",
    "data",
    "hora",
    "dia_semana",
    "latitude",
    "longitude",
    "log1",
    "log2",
    "tipo_via",
    "tipo_acidente",
    "regiao",
    "gravidade",
    "status",
    "motivo_descarte",
    "original",
]


def conectar(caminho: Path) -> sqlite3.Connection:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(caminho)
    conn.executescript(ESQUEMA)
    return conn


def gravar_carga(
    conn: sqlite3.Connection,
    limpo: pd.DataFrame,
    arquivo: str,
    data_carga: str,
    resumo: dict,
    data_extracao: str | None,
) -> int:
    """Substitui os acidentes pela nova carga e registra a carga. Retorna o id da carga."""
    with conn:
        cursor = conn.execute(
            "INSERT INTO carga (arquivo_origem, data_carga, total_lido, total_aceito, total_descartado,"
            " descartes_por_motivo, data_extracao) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                arquivo,
                data_carga,
                resumo["total_lido"],
                resumo["total_aceito"],
                resumo["total_descartado"],
                json.dumps(resumo["descartes_por_motivo"], ensure_ascii=False),
                data_extracao,
            ),
        )
        carga_id = int(cursor.lastrowid)
        conn.execute("DELETE FROM acidente")

        tabela = limpo[COLUNAS_ACIDENTE].copy()
        tabela["data"] = tabela["data"].dt.strftime("%Y-%m-%d")
        tabela["carga_id"] = carga_id
        tabela["origem_arquivo"] = arquivo
        tabela = tabela.astype(object).where(tabela.notna(), None)
        colunas = list(tabela.columns)
        conn.executemany(
            f"INSERT INTO acidente ({', '.join(colunas)}) VALUES ({', '.join('?' * len(colunas))})",
            tabela.itertuples(index=False, name=None),
        )
    return carga_id


def ultima_carga(conn: sqlite3.Connection) -> dict | None:
    linha = conn.execute(
        "SELECT id, arquivo_origem, data_carga, total_lido, total_aceito, total_descartado,"
        " descartes_por_motivo, data_extracao FROM carga ORDER BY id DESC LIMIT 1"
    ).fetchone()
    if linha is None:
        return None
    chaves = [
        "id",
        "arquivo_origem",
        "data_carga",
        "total_lido",
        "total_aceito",
        "total_descartado",
        "descartes_por_motivo",
        "data_extracao",
    ]
    carga = dict(zip(chaves, linha))
    carga["descartes_por_motivo"] = json.loads(carga["descartes_por_motivo"])
    return carga


def ler_validos(conn: sqlite3.Connection) -> pd.DataFrame:
    """Acidentes válidos, prontos para filtros e cálculo de pontos críticos."""
    df = pd.read_sql_query(
        "SELECT id, data, hora, dia_semana, latitude, longitude, log1, log2, tipo_via, regiao, gravidade"
        " FROM acidente WHERE status = 'valido'",
        conn,
    )
    df["data"] = pd.to_datetime(df["data"])
    df["hora_num"] = pd.to_numeric(df["hora"].str.slice(0, 2), errors="coerce")
    return df
