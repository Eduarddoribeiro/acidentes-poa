"""Validação e limpeza da base de acidentes (M1 e M2).

As funções aqui são puras: recebem um DataFrame lido do CSV da Prefeitura e devolvem
um DataFrame padronizado, com status (válido ou descartado) e motivo do descarte.
"""

import json

import pandas as pd

from app.config import LIMITES_POA

# Colunas que o pipeline usa. Se faltar alguma, a carga é interrompida.
COLUNAS_OBRIGATORIAS = [
    "idacidente",
    "data",
    "hora",
    "latitude",
    "longitude",
    "log1",
    "log2",
    "tipo_acid",
    "ups",
    "feridos",
    "mortes",
    "fatais",
    "regiao",
]

# LGPD: a base não deve trazer dados pessoais. Se algum destes campos aparecer, ele é removido.
COLUNAS_PESSOAIS = ["nome", "cpf", "rg", "placa", "cnh", "telefone", "endereco_vitima"]

# Motivos de descarte, na ordem em que são verificados.
MOTIVO_ID_INVALIDO = "id_invalido"
MOTIVO_ID_DUPLICADO = "id_duplicado"
MOTIVO_DATA_INVALIDA = "data_invalida"
MOTIVO_DATA_FUTURA = "data_posterior_a_extracao"
MOTIVO_SEM_COORDENADA = "sem_coordenada"
MOTIVO_FORA_DE_POA = "coordenada_fora_de_poa"

STATUS_VALIDO = "valido"
STATUS_DESCARTADO = "descartado"

# UPS (unidade padrão de severidade) da EPTC: 1 sem vítimas, 5 com feridos, 13 com mortos.
GRAVIDADE_POR_UPS = {1: "sem_vitimas", 5: "com_feridos", 13: "com_mortos"}

# Tipo de via a partir da sigla do logradouro usada pela própria Prefeitura (RN-05).
TIPO_VIA_POR_SIGLA = {
    "AV": "avenida",
    "R": "rua",
    "ESTR": "estrada",
    "ROD": "rodovia",
    "RS": "rodovia",
    "BR": "rodovia",
}
TIPO_VIA_OUTRA = "outra"


class ColunasAusentesError(ValueError):
    """O arquivo não tem as colunas esperadas da base de acidentes."""

    def __init__(self, faltando: list[str]):
        self.faltando = faltando
        super().__init__("Colunas ausentes no arquivo: " + ", ".join(faltando))


def validar_colunas(df: pd.DataFrame) -> None:
    """Interrompe a carga se faltar alguma coluna obrigatória."""
    faltando = [c for c in COLUNAS_OBRIGATORIAS if c not in df.columns]
    if faltando:
        raise ColunasAusentesError(faltando)


def remover_dados_pessoais(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Remove colunas com dados pessoais, se existirem, e informa quais foram removidas."""
    encontradas = [c for c in df.columns if c.strip().lower() in COLUNAS_PESSOAIS]
    return df.drop(columns=encontradas), encontradas


def _numero(serie: pd.Series) -> pd.Series:
    """Converte texto em número, aceitando vírgula como separador decimal."""
    texto = serie.astype("string").str.strip().str.replace(",", ".", regex=False)
    return pd.to_numeric(texto, errors="coerce")


def _hora(serie: pd.Series) -> pd.Series:
    """Converte '12:30:00.0000000' em '12:30'. Valores inválidos viram nulo."""
    texto = serie.astype("string").str.strip().str.slice(0, 5)
    valida = texto.str.fullmatch(r"([01]\d|2[0-3]):[0-5]\d").fillna(False).astype(bool)
    return texto.where(valida)


def tipo_via(logradouro: object) -> str:
    """Classifica a via pela sigla inicial do logradouro (AV, R, ESTR...)."""
    if not isinstance(logradouro, str) or not logradouro.strip():
        return TIPO_VIA_OUTRA
    sigla = logradouro.strip().split()[0].upper().rstrip(".")
    return TIPO_VIA_POR_SIGLA.get(sigla, TIPO_VIA_OUTRA)


def _gravidade(ups: pd.Series, mortes: pd.Series, feridos: pd.Series) -> pd.Series:
    """Gravidade pela UPS; se a UPS vier vazia ou fora do padrão, usa as contagens de vítimas."""
    gravidade = ups.map(GRAVIDADE_POR_UPS)
    pelas_contagens = pd.Series("sem_vitimas", index=ups.index)
    pelas_contagens[feridos.fillna(0) > 0] = "com_feridos"
    pelas_contagens[mortes.fillna(0) > 0] = "com_mortos"
    return gravidade.fillna(pelas_contagens)


def _texto(serie: pd.Series) -> pd.Series:
    texto = serie.astype("string").str.strip()
    return texto.where(texto != "")


def limpar(bruto: pd.DataFrame) -> pd.DataFrame:
    """Padroniza a base e marca cada registro como válido ou descartado, com motivo.

    O registro original é guardado em JSON para permitir reprocessamento (Fase 2, F5).
    """
    validar_colunas(bruto)
    bruto, _ = remover_dados_pessoais(bruto)
    bruto = bruto.reset_index(drop=True)

    df = pd.DataFrame(index=bruto.index)
    id_numerico = _numero(bruto["idacidente"])
    df["id_origem"] = id_numerico.round().astype("Int64")
    df["data"] = pd.to_datetime(bruto["data"].astype("string").str.strip(), errors="coerce").dt.normalize()
    df["hora"] = _hora(bruto["hora"])
    df["dia_semana"] = df["data"].dt.day_of_week.astype("Int64")  # 0 = segunda, 6 = domingo
    df["latitude"] = _numero(bruto["latitude"])
    df["longitude"] = _numero(bruto["longitude"])
    df["log1"] = _texto(bruto["log1"])
    df["log2"] = _texto(bruto["log2"])
    df["tipo_via"] = df["log1"].map(tipo_via)
    df["tipo_acidente"] = _texto(bruto["tipo_acid"])
    df["regiao"] = _texto(bruto["regiao"])
    feridos = _numero(bruto["feridos"])
    mortes = _numero(bruto["mortes"]).fillna(0) + _numero(bruto["fatais"]).fillna(0)
    df["gravidade"] = _gravidade(_numero(bruto["ups"]), mortes, feridos)

    # Marca o primeiro motivo de descarte que se aplica a cada registro.
    motivo = pd.Series(pd.NA, index=df.index, dtype="string")

    def marcar(condicao: pd.Series, nome: str) -> None:
        motivo[condicao.fillna(False).astype(bool) & motivo.isna()] = nome

    marcar(df["id_origem"].isna(), MOTIVO_ID_INVALIDO)
    marcar(df["id_origem"].duplicated(keep="first") & df["id_origem"].notna(), MOTIVO_ID_DUPLICADO)
    marcar(df["data"].isna(), MOTIVO_DATA_INVALIDA)
    # Um acidente não pode ter acontecido depois da extração da base (há casos como 2029 na origem).
    if "data_extracao" in bruto.columns:
        extracao = pd.to_datetime(bruto["data_extracao"].astype("string").str.strip(), errors="coerce").dt.normalize()
        marcar(df["data"] > extracao, MOTIVO_DATA_FUTURA)
    marcar(df["latitude"].isna() | df["longitude"].isna(), MOTIVO_SEM_COORDENADA)
    fora = (
        (df["latitude"] < LIMITES_POA["lat_min"])
        | (df["latitude"] > LIMITES_POA["lat_max"])
        | (df["longitude"] < LIMITES_POA["lon_min"])
        | (df["longitude"] > LIMITES_POA["lon_max"])
    )
    marcar(fora, MOTIVO_FORA_DE_POA)

    df["motivo_descarte"] = motivo
    df["status"] = motivo.isna().map({True: STATUS_VALIDO, False: STATUS_DESCARTADO})
    df["original"] = [
        json.dumps({k: (None if pd.isna(v) else v) for k, v in linha.items()}, ensure_ascii=False)
        for linha in bruto.to_dict(orient="records")
    ]
    return df


def resumo(df: pd.DataFrame) -> dict:
    """Totais de aceitos e descartados por motivo, para o relatório de carga."""
    descartados = df[df["status"] == STATUS_DESCARTADO]
    validos = df[df["status"] == STATUS_VALIDO]
    return {
        "total_lido": int(len(df)),
        "total_aceito": int(len(validos)),
        "total_descartado": int(len(descartados)),
        "descartes_por_motivo": {k: int(v) for k, v in descartados["motivo_descarte"].value_counts().items()},
        "aceitos_sem_hora": int(validos["hora"].isna().sum()),
    }
