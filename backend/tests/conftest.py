import pandas as pd
import pytest

from app.core.config import Settings
from tests.factories import SOURCE_HEADER


@pytest.fixture
def write_csv(tmp_path):
    def _write(rows: list[str], name: str = "cat_acidentes.csv"):
        path = tmp_path / name
        path.write_text("\n".join([SOURCE_HEADER, *rows]) + "\n", encoding="utf-8")
        return path

    return _write


@pytest.fixture
def read_rows(write_csv):
    from app.pipeline.ingest import read_source_csv

    def _read(rows: list[str]) -> pd.DataFrame:
        return read_source_csv(write_csv(rows))

    return _read


@pytest.fixture
def settings(tmp_path) -> Settings:
    """Settings pointing at a temporary database, with N = 10 to keep the fixtures small."""
    return Settings(
        db_path=tmp_path / "test.db",
        reports_dir=tmp_path,
        backup_dir=tmp_path / "backup",
        hotspot_min_accidents=10,
    )
