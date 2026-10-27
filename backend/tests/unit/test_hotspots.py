import numpy as np
import pandas as pd

from app.domain import hotspots

# About 1 meter in degrees of latitude.
METER = 1 / 110_540


def _accidents(coordinates: list[tuple[float, float]], street: str = "AV IPIRANGA", cross_street: str | None = None):
    return pd.DataFrame(
        {
            "latitude": [c[0] for c in coordinates],
            "longitude": [c[1] for c in coordinates],
            "street": street,
            "cross_street": cross_street,
            "severity": "no_injuries",
            "date": pd.Timestamp("2024-01-01"),
            "region": "CENTRO",
        }
    )


def _around(lat: float, lon: float, count: int, spread_m: float) -> list[tuple[float, float]]:
    steps = np.linspace(-spread_m, spread_m, count)
    return [(lat + s * METER, lon) for s in steps]


def test_neighbors_respect_the_radius() -> None:
    x = np.array([0.0, 99.0, 101.0, 250.0])
    y = np.zeros(4)

    neighbors = hotspots.find_neighbors(x, y, 100)

    assert sorted(neighbors[0].tolist()) == [0, 1]
    assert sorted(neighbors[1].tolist()) == [0, 1, 2]
    assert sorted(neighbors[3].tolist()) == [3]


def test_group_with_n_or_more_becomes_a_hotspot() -> None:
    df = _accidents(_around(-30.03, -51.21, 12, 40))

    result = hotspots.compute_hotspots(df, radius=100, min_accidents=12)

    assert len(result) == 1
    assert result[0].total == 12
    assert result[0].rank == 1


def test_group_below_n_is_not_a_hotspot() -> None:
    df = _accidents(_around(-30.03, -51.21, 11, 40))

    assert hotspots.compute_hotspots(df, radius=100, min_accidents=12) == []


def test_accidents_spread_beyond_the_radius_do_not_form_a_hotspot() -> None:
    # 12 accidents 300 m apart.
    df = _accidents([(-30.03 + i * 300 * METER, -51.21) for i in range(12)])

    assert hotspots.compute_hotspots(df, radius=100, min_accidents=2) == []


def test_each_accident_counts_in_a_single_hotspot_and_list_is_sorted() -> None:
    large = _around(-30.03, -51.21, 20, 30)
    small = _around(-30.05, -51.21, 8, 30)
    df = _accidents(large + small)

    result = hotspots.compute_hotspots(df, radius=100, min_accidents=5)

    assert [h.total for h in result] == [20, 8]
    assert [h.rank for h in result] == [1, 2]
    assert sum(h.total for h in result) == len(df)


def test_hotspot_composition_and_period() -> None:
    df = _accidents(_around(-30.03, -51.21, 4, 10))
    df["severity"] = ["no_injuries", "with_injuries", "with_injuries", "with_fatalities"]
    df["date"] = pd.to_datetime(["2022-05-01", "2023-01-01", "2024-02-02", "2021-03-03"])

    hotspot = hotspots.compute_hotspots(df, radius=100, min_accidents=4)[0]

    assert (hotspot.no_injuries, hotspot.with_injuries, hotspot.with_fatalities) == (1, 2, 1)
    assert (hotspot.first_date, hotspot.last_date) == ("2021-03-03", "2024-02-02")


def test_name_uses_the_most_frequent_intersection() -> None:
    df = _accidents(_around(-30.03, -51.21, 3, 10), street="AV IPIRANGA", cross_street="AV AZENHA")
    df.loc[0, "cross_street"] = None

    hotspot = hotspots.compute_hotspots(df, radius=100, min_accidents=3)[0]

    assert hotspot.name == "Av. Azenha × Av. Ipiranga"


def test_place_without_street_name_has_no_name() -> None:
    df = _accidents(_around(-30.03, -51.21, 3, 10), street=None)

    assert hotspots.compute_hotspots(df, radius=100, min_accidents=3)[0].name is None


def test_format_street_name() -> None:
    assert hotspots.format_street_name("AV BORGES DE MEDEIROS") == "Av. Borges de Medeiros"
    assert hotspots.format_street_name("R DA REPUBLICA") == "R. da Republica"
    assert hotspots.format_street_name("") is None


def test_empty_dataset_has_no_hotspots() -> None:
    assert hotspots.compute_hotspots(_accidents([]), radius=100, min_accidents=1) == []
