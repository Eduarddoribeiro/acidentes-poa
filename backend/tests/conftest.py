import pandas as pd
import pytest

CABECALHO = (
    "data_extracao;predial1;queda_arr;data;feridos;feridos_gr;mortes;morte_post;fatais;auto;taxi;lotacao;"
    "onibus_urb;onibus_met;onibus_int;caminhao;moto;carroca;bicicleta;outro;cont_vit;ups;patinete;idacidente;"
    "longitude;latitude;log1;log2;tipo_acid;dia_sem;hora;noite_dia;regiao;consorcio"
)


def linha(
    id_: str,
    data: str = "2024-03-02 00:00:00",
    hora: str = "12:30:00.0000000",
    lat: str = "-30.0346",
    lon: str = "-51.2177",
    log1: str = "AV BORGES DE MEDEIROS",
    log2: str = "",
    ups: str = "1",
    feridos: str = "0",
    mortes: str = "0",
) -> str:
    """Uma linha no formato do CSV da Prefeitura, com valores padrão no centro de Porto Alegre."""
    return (
        f"2026-10-01 01:34:27;100;0.0;{data};{feridos};0;{mortes};0;0;1;0;0;0;0;0;0;0;0;0;0;0;{ups};0;"
        f"{id_};{lon};{lat};{log1};{log2};COLISÃO;SÁBADO;{hora};DIA;CENTRO;"
    )


@pytest.fixture
def escrever_csv(tmp_path):
    def _escrever(linhas: list[str], nome: str = "cat_acidentes.csv"):
        caminho = tmp_path / nome
        caminho.write_text("\n".join([CABECALHO, *linhas]) + "\n", encoding="utf-8")
        return caminho

    return _escrever


@pytest.fixture
def ler(escrever_csv):
    from app.ingestao import ler_csv

    def _ler(linhas: list[str]) -> pd.DataFrame:
        return ler_csv(escrever_csv(linhas))

    return _ler
