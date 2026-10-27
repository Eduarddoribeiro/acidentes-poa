import json
import sqlite3
from datetime import date

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app import config, consultas, ingestao, main
from tests.conftest import CABECALHO, linha


@pytest.fixture
def base_carregada(tmp_path, escrever_csv, monkeypatch):
    """Banco temporário com 12 acidentes concentrados, 2 isolados e 2 descartados."""
    linhas = [linha(str(i), lat=f"{-30.0346 + i * 0.00002:.6f}") for i in range(12)]
    linhas += [
        linha("100", lat="-30.10", lon="-51.20", data="2025-06-07 00:00:00", hora="23:10:00.0000000"),
        linha("101", lat="-30.12", lon="-51.20", data="2021-02-01 00:00:00", log1="R DA REPUBLICA"),
        linha("200", lat=""),
        linha("201", data="data errada"),
    ]
    arquivo = escrever_csv(linhas)
    caminho_banco = tmp_path / "teste.db"
    monkeypatch.setattr(config, "CAMINHO_BANCO", caminho_banco)
    monkeypatch.setattr(config, "PASTA_BACKUP", tmp_path / "backup")
    monkeypatch.setattr(ingestao, "PASTA_BACKUP", tmp_path / "backup")
    monkeypatch.setattr(config, "N_MINIMO", 10)
    monkeypatch.setattr(main, "base", main.Base())
    main._pontos.cache_clear()
    relatorio = ingestao.carregar(arquivo, caminho_banco, tmp_path)
    return relatorio, caminho_banco


def test_carga_gera_relatorio_com_aceitos_e_descartados(base_carregada, tmp_path) -> None:
    relatorio, caminho_banco = base_carregada

    assert relatorio["total_lido"] == 16
    assert relatorio["total_aceito"] == 14
    assert relatorio["descartes_por_motivo"] == {"sem_coordenada": 1, "data_invalida": 1}
    assert relatorio["data_extracao"] == "2026-10-01"
    salvo = json.loads((tmp_path / f"relatorio_carga_{relatorio['carga_id']}.json").read_text(encoding="utf-8"))
    assert salvo["total_descartado"] == 2

    conn = sqlite3.connect(caminho_banco)
    motivos = dict(conn.execute("SELECT status, COUNT(*) FROM acidente GROUP BY status").fetchall())
    conn.close()
    assert motivos == {"valido": 14, "descartado": 2}


def test_nova_carga_substitui_a_anterior_e_faz_backup(base_carregada, escrever_csv, tmp_path) -> None:
    _, caminho_banco = base_carregada

    relatorio = ingestao.carregar(escrever_csv([linha("1")], "nova.csv"), caminho_banco, tmp_path)

    conn = sqlite3.connect(caminho_banco)
    total = conn.execute("SELECT COUNT(*) FROM acidente").fetchone()[0]
    cargas = conn.execute("SELECT COUNT(*) FROM carga").fetchone()[0]
    conn.close()
    assert total == 1
    assert cargas == 2
    assert relatorio["backup"] is not None
    assert list((tmp_path / "backup").glob("*.db"))


def test_cli_interrompe_quando_faltam_colunas(tmp_path, capsys) -> None:
    arquivo = tmp_path / "errado.csv"
    arquivo.write_text("a;b\n1;2\n", encoding="utf-8")

    codigo = ingestao.main([str(arquivo)])

    assert codigo == 2
    assert "Colunas ausentes" in capsys.readouterr().err


def test_le_arquivo_em_latin1(tmp_path) -> None:
    arquivo = tmp_path / "latin1.csv"
    arquivo.write_bytes(("\n".join([CABECALHO, linha("1")]) + "\n").encode("latin-1"))

    assert ingestao.ler_csv(arquivo).iloc[0]["tipo_acid"] == "COLISÃO"


# Filtros


def _acidentes_para_filtro() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "data": pd.to_datetime(["2024-03-02", "2024-03-02", "2024-03-03", "2024-03-04", "2019-01-01"]),
            "hora_num": [22, 1, 23, 12, float("nan")],
            "dia_semana": [5, 5, 6, 0, 1],
            "tipo_via": ["avenida", "rua", "avenida", "avenida", "rua"],
        }
    )


def test_periodo_padrao_sao_os_ultimos_5_anos() -> None:
    datas = pd.Series(pd.to_datetime(["2019-01-01", "2026-09-30"]))

    assert consultas.periodo_padrao(datas) == (date(2021, 1, 1), date(2026, 9, 30))


def test_filtro_de_horario_que_passa_da_meia_noite_combina_com_dia() -> None:
    # RN-04: "sábado, 22h às 2h".
    filtros = consultas.Filtros(
        inicio=date(2024, 1, 1), fim=date(2024, 12, 31), hora_inicio=22, hora_fim=2, dias=(5,)
    )

    recorte = consultas.aplicar(_acidentes_para_filtro(), filtros)

    assert recorte.index.tolist() == [0, 1]


def test_filtro_de_via_e_periodo() -> None:
    filtros = consultas.Filtros(inicio=date(2024, 3, 3), fim=date(2024, 12, 31), vias=("avenida",))

    assert consultas.aplicar(_acidentes_para_filtro(), filtros).index.tolist() == [2, 3]


def test_sem_filtro_de_horario_mantem_registros_sem_hora() -> None:
    filtros = consultas.Filtros(inicio=date(2010, 1, 1), fim=date(2030, 1, 1))

    assert len(consultas.aplicar(_acidentes_para_filtro(), filtros)) == 5


# API


def test_meta_informa_criterio_periodo_e_descartes(base_carregada) -> None:
    resposta = TestClient(main.app).get("/api/meta")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["criterio"] == {"raio_metros": 100, "n_minimo": 10}
    assert dados["carga"]["total_descartado"] == 2
    assert dados["carga"]["percentual_sem_coordenada"] == 6.2
    assert dados["periodo_base"] == {"inicio": "2021-02-01", "fim": "2025-06-07"}
    assert dados["tipos_via"] == {"avenida": 13, "rua": 1}


def test_pontos_criticos_pela_api(base_carregada) -> None:
    resposta = TestClient(main.app).get("/api/pontos-criticos")

    pontos = resposta.json()["pontos"]
    assert len(pontos) == 1
    assert pontos[0]["total"] == 12
    assert pontos[0]["nome"] == "Av. Borges de Medeiros"


def test_calor_respeita_filtros(base_carregada) -> None:
    cliente = TestClient(main.app)

    todos = cliente.get("/api/calor").json()
    noite = cliente.get("/api/calor", params={"hora_inicio": 22, "hora_fim": 2}).json()
    rua = cliente.get("/api/calor", params={"vias": "rua"}).json()

    assert todos["total"] == 14
    assert noite["total"] == 1
    assert rua["total"] == 1
    assert sum(p[2] for p in todos["pontos"]) == 14


def test_filtro_invalido_responde_422(base_carregada) -> None:
    cliente = TestClient(main.app)

    assert cliente.get("/api/calor", params={"dias": "9"}).status_code == 422
    assert cliente.get("/api/calor", params={"vias": "ciclovia"}).status_code == 422
    assert cliente.get("/api/calor", params={"hora_inicio": 30}).status_code == 422


def test_sem_base_responde_503(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(config, "CAMINHO_BANCO", tmp_path / "nao_existe.db")
    monkeypatch.setattr(main, "base", main.Base())

    resposta = TestClient(main.app).get("/api/meta")

    assert resposta.status_code == 503
    assert "ingestao" in resposta.json()["detail"]
