import pandas as pd
import pytest

from app import limpeza
from tests.conftest import linha


def test_registro_completo_e_valido(ler) -> None:
    df = limpeza.limpar(ler([linha("1000,0")]))

    registro = df.iloc[0]
    assert registro["status"] == "valido"
    assert pd.isna(registro["motivo_descarte"])
    assert registro["id_origem"] == 1000
    assert registro["data"] == pd.Timestamp("2024-03-02")
    assert registro["hora"] == "12:30"
    assert registro["dia_semana"] == 5  # sábado
    assert registro["latitude"] == pytest.approx(-30.0346)
    assert registro["tipo_via"] == "avenida"


def test_sem_coordenada_e_descartado(ler) -> None:
    df = limpeza.limpar(ler([linha("1", lat="", lon="")]))

    assert df.iloc[0]["status"] == "descartado"
    assert df.iloc[0]["motivo_descarte"] == "sem_coordenada"


def test_coordenada_fora_de_porto_alegre_e_descartada(ler) -> None:
    # Coordenada de São Paulo e coordenada zerada.
    df = limpeza.limpar(ler([linha("1", lat="-23.55", lon="-46.63"), linha("2", lat="0", lon="0")]))

    assert df["motivo_descarte"].tolist() == ["coordenada_fora_de_poa", "coordenada_fora_de_poa"]


def test_data_invalida_e_descartada(ler) -> None:
    df = limpeza.limpar(ler([linha("1", data="2024-13-45"), linha("2", data="")]))

    assert df["motivo_descarte"].tolist() == ["data_invalida", "data_invalida"]


def test_data_depois_da_extracao_e_descartada(ler) -> None:
    df = limpeza.limpar(ler([linha("1", data="2029-09-11 00:00:00"), linha("2", data="2026-09-30 00:00:00")]))

    assert df["motivo_descarte"].tolist()[0] == "data_posterior_a_extracao"
    assert df.iloc[1]["status"] == "valido"


def test_id_duplicado_mantem_o_primeiro(ler) -> None:
    df = limpeza.limpar(ler([linha("7,0"), linha("7,0")]))

    assert df["status"].tolist() == ["valido", "descartado"]
    assert df.iloc[1]["motivo_descarte"] == "id_duplicado"


def test_id_invalido_e_descartado(ler) -> None:
    df = limpeza.limpar(ler([linha("abc")]))

    assert df.iloc[0]["motivo_descarte"] == "id_invalido"


def test_hora_invalida_vira_nula_mas_registro_continua(ler) -> None:
    df = limpeza.limpar(ler([linha("1", hora=""), linha("2", hora="25:00:00.0000000")]))

    assert df["status"].tolist() == ["valido", "valido"]
    assert df["hora"].isna().all()


def test_registro_original_e_guardado(ler) -> None:
    df = limpeza.limpar(ler([linha("1", lat="")]))

    assert '"idacidente": "1"' in df.iloc[0]["original"]


@pytest.mark.parametrize(
    ("ups", "feridos", "mortes", "esperado"),
    [
        ("1", "0", "0", "sem_vitimas"),
        ("5", "2", "0", "com_feridos"),
        ("13", "0", "1", "com_mortos"),
        ("", "1", "0", "com_feridos"),
        ("", "0", "1", "com_mortos"),
    ],
)
def test_gravidade(ler, ups, feridos, mortes, esperado) -> None:
    df = limpeza.limpar(ler([linha("1", ups=ups, feridos=feridos, mortes=mortes)]))

    assert df.iloc[0]["gravidade"] == esperado


@pytest.mark.parametrize(
    ("logradouro", "esperado"),
    [
        ("AV IPIRANGA", "avenida"),
        ("R DA REPUBLICA", "rua"),
        ("ESTR JOAO DE OLIVEIRA REMIAO", "estrada"),
        ("TUN DA CONCEICAO", "outra"),
        ("", "outra"),
        (None, "outra"),
    ],
)
def test_tipo_via(logradouro, esperado) -> None:
    assert limpeza.tipo_via(logradouro) == esperado


def test_colunas_ausentes_interrompem_a_carga() -> None:
    bruto = pd.DataFrame({"data": ["2024-01-01"], "latitude": ["-30"]})

    with pytest.raises(limpeza.ColunasAusentesError) as erro:
        limpeza.limpar(bruto)

    assert "idacidente" in erro.value.faltando


def test_colunas_pessoais_sao_removidas(ler) -> None:
    bruto = ler([linha("1")])
    bruto["placa"] = "ABC1D23"

    sem_pessoais, removidas = limpeza.remover_dados_pessoais(bruto)

    assert removidas == ["placa"]
    assert "placa" not in sem_pessoais.columns
    assert "ABC1D23" not in limpeza.limpar(bruto).iloc[0]["original"]


def test_resumo_conta_aceitos_e_descartados_por_motivo(ler) -> None:
    df = limpeza.limpar(ler([linha("1"), linha("2", lat=""), linha("3", lat=""), linha("4", data="x")]))

    resumo = limpeza.resumo(df)

    assert resumo["total_lido"] == 4
    assert resumo["total_aceito"] == 1
    assert resumo["total_descartado"] == 3
    assert resumo["descartes_por_motivo"] == {"sem_coordenada": 2, "data_invalida": 1}
