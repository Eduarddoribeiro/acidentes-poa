"""Heatmap cells (M4)."""

import pandas as pd


def heatmap_cells(accidents: pd.DataFrame, decimals: int = 4) -> list[tuple[float, float, int]]:
    """Accidents grouped into cells of about 10 m, to keep the response light.

    Each item is (latitude, longitude, count).
    """
    if accidents.empty:
        return []
    cells = (
        pd.DataFrame({"lat": accidents["latitude"].round(decimals), "lon": accidents["longitude"].round(decimals)})
        .value_counts()
        .reset_index(name="count")
    )
    return list(zip(cells["lat"].tolist(), cells["lon"].tolist(), cells["count"].tolist()))
