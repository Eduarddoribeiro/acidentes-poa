"""Builders for rows in the format of the City's CSV."""

SOURCE_HEADER = (
    "data_extracao;predial1;queda_arr;data;feridos;feridos_gr;mortes;morte_post;fatais;auto;taxi;lotacao;"
    "onibus_urb;onibus_met;onibus_int;caminhao;moto;carroca;bicicleta;outro;cont_vit;ups;patinete;idacidente;"
    "longitude;latitude;log1;log2;tipo_acid;dia_sem;hora;noite_dia;regiao;consorcio"
)


def source_row(
    id_: str,
    date: str = "2024-03-02 00:00:00",
    time: str = "12:30:00.0000000",
    lat: str = "-30.0346",
    lon: str = "-51.2177",
    street: str = "AV BORGES DE MEDEIROS",
    cross_street: str = "",
    ups: str = "1",
    injured: str = "0",
    deaths: str = "0",
) -> str:
    """One CSV row, with defaults in downtown Porto Alegre."""
    return (
        f"2026-10-01 01:34:27;100;0.0;{date};{injured};0;{deaths};0;0;1;0;0;0;0;0;0;0;0;0;0;0;{ups};0;"
        f"{id_};{lon};{lat};{street};{cross_street};COLISÃO;SÁBADO;{time};DIA;CENTRO;"
    )
