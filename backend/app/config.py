"""Configurações do projeto: caminhos, fonte dos dados e parâmetros das regras de negócio."""

import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PASTA_RAW = RAIZ / "data" / "raw"
PASTA_PROCESSED = RAIZ / "data" / "processed"
PASTA_BACKUP = PASTA_PROCESSED / "backup"

# Caminho do banco SQLite. Pode ser trocado por variável de ambiente (útil em testes e no deploy).
CAMINHO_BANCO = Path(os.environ.get("ACIDENTES_DB", PASTA_PROCESSED / "acidentes.db"))

# Base aberta da Prefeitura (#DataPoa / EPTC), conjunto "Acidentes de Trânsito - Acidentes".
URL_BASE = (
    "https://dadosabertos.poa.br/dataset/d6cfbe48-ee1f-450f-87f5-9426f6a09328/"
    "resource/b56f8123-716a-4893-9348-23945f1ea1b9/download/cat_acidentes.csv"
)
URL_PAGINA_BASE = "https://dadosabertos.poa.br/dataset/acidentes-de-transito-acidentes"

# RN-01: ponto crítico é um local com N ou mais acidentes num raio de 100 m.
# N foi escolhido na análise exploratória (notebooks/analise_exploratoria.ipynb).
RAIO_METROS = 100
N_MINIMO = int(os.environ.get("ACIDENTES_N_MINIMO", 20))

# RN-03: período padrão do painel, em anos, contado a partir do registro mais recente.
ANOS_PERIODO_PADRAO = 5

# Retângulo que contém o município de Porto Alegre, com folga de cerca de 3 km.
# Coordenadas fora dele são consideradas erradas (RN-02 e M2).
LIMITES_POA = {
    "lat_min": -30.30,
    "lat_max": -29.90,
    "lon_min": -51.33,
    "lon_max": -50.98,
}
