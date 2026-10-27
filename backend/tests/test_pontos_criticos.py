import numpy as np
import pandas as pd

from app import pontos_criticos

# Cerca de 1 metro em graus de latitude.
METRO = 1 / 110_540


def _acidentes(coordenadas: list[tuple[float, float]], log1: str = "AV IPIRANGA", log2: str | None = None):
    return pd.DataFrame(
        {
            "latitude": [c[0] for c in coordenadas],
            "longitude": [c[1] for c in coordenadas],
            "log1": log1,
            "log2": log2,
            "gravidade": "sem_vitimas",
            "data": pd.Timestamp("2024-01-01"),
            "regiao": "CENTRO",
        }
    )


def _em_volta(lat: float, lon: float, quantidade: int, espalhamento_m: float) -> list[tuple[float, float]]:
    passos = np.linspace(-espalhamento_m, espalhamento_m, quantidade)
    return [(lat + p * METRO, lon) for p in passos]


def test_vizinhos_respeita_o_raio() -> None:
    x = np.array([0.0, 99.0, 101.0, 250.0])
    y = np.zeros(4)

    viz = pontos_criticos.vizinhos(x, y, 100)

    assert sorted(viz[0].tolist()) == [0, 1]
    assert sorted(viz[1].tolist()) == [0, 1, 2]
    assert sorted(viz[3].tolist()) == [3]


def test_grupo_com_n_ou_mais_vira_ponto_critico() -> None:
    df = _acidentes(_em_volta(-30.03, -51.21, 12, 40))

    pontos = pontos_criticos.calcular(df, raio=100, minimo=12)

    assert len(pontos) == 1
    assert pontos[0]["total"] == 12
    assert pontos[0]["posicao"] == 1


def test_grupo_abaixo_de_n_nao_vira_ponto() -> None:
    df = _acidentes(_em_volta(-30.03, -51.21, 11, 40))

    assert pontos_criticos.calcular(df, raio=100, minimo=12) == []


def test_acidentes_espalhados_alem_do_raio_nao_formam_ponto() -> None:
    # 12 acidentes a 300 m um do outro.
    df = _acidentes([(-30.03 + i * 300 * METRO, -51.21) for i in range(12)])

    assert pontos_criticos.calcular(df, raio=100, minimo=2) == []


def test_cada_acidente_conta_em_um_unico_ponto_e_lista_vem_ordenada() -> None:
    grande = _em_volta(-30.03, -51.21, 20, 30)
    pequeno = _em_volta(-30.05, -51.21, 8, 30)
    df = _acidentes(grande + pequeno)

    pontos = pontos_criticos.calcular(df, raio=100, minimo=5)

    assert [p["total"] for p in pontos] == [20, 8]
    assert [p["posicao"] for p in pontos] == [1, 2]
    assert sum(p["total"] for p in pontos) == len(df)


def test_composicao_e_periodo_do_ponto() -> None:
    df = _acidentes(_em_volta(-30.03, -51.21, 4, 10))
    df["gravidade"] = ["sem_vitimas", "com_feridos", "com_feridos", "com_mortos"]
    df["data"] = pd.to_datetime(["2022-05-01", "2023-01-01", "2024-02-02", "2021-03-03"])

    ponto = pontos_criticos.calcular(df, raio=100, minimo=4)[0]

    assert (ponto["sem_vitimas"], ponto["com_feridos"], ponto["com_mortos"]) == (1, 2, 1)
    assert (ponto["data_inicio"], ponto["data_fim"]) == ("2021-03-03", "2024-02-02")


def test_nome_usa_cruzamento_mais_frequente() -> None:
    df = _acidentes(_em_volta(-30.03, -51.21, 3, 10), log1="AV IPIRANGA", log2="AV AZENHA")
    df.loc[0, "log2"] = None

    ponto = pontos_criticos.calcular(df, raio=100, minimo=3)[0]

    assert ponto["nome"] == "Av. Azenha × Av. Ipiranga"


def test_formatar_logradouro() -> None:
    assert pontos_criticos.formatar_logradouro("AV BORGES DE MEDEIROS") == "Av. Borges de Medeiros"
    assert pontos_criticos.formatar_logradouro("R DA REPUBLICA") == "R. da Republica"
    assert pontos_criticos.formatar_logradouro("") is None


def test_base_vazia_nao_tem_pontos() -> None:
    assert pontos_criticos.calcular(_acidentes([]), raio=100, minimo=1) == []
