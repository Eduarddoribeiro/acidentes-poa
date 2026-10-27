"""Project settings: paths, data source and business-rule parameters."""

import os
from dataclasses import dataclass
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT_DIR / "data" / "raw"
PROCESSED_DIR = ROOT_DIR / "data" / "processed"
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"

# Open dataset published by the City of Porto Alegre (#DataPoa / EPTC), "Acidentes de Trânsito - Acidentes".
SOURCE_NAME = "#DataPoa / EPTC"
SOURCE_CSV_URL = (
    "https://dadosabertos.poa.br/dataset/d6cfbe48-ee1f-450f-87f5-9426f6a09328/"
    "resource/b56f8123-716a-4893-9348-23945f1ea1b9/download/cat_acidentes.csv"
)
SOURCE_PAGE_URL = "https://dadosabertos.poa.br/dataset/acidentes-de-transito-acidentes"
SOURCE_FILE_NAME = "cat_acidentes.csv"


@dataclass(frozen=True)
class Bounds:
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


# Box around the city of Porto Alegre with about 3 km of slack.
# Coordinates outside it are treated as wrong (RN-02 and M2).
CITY_BOUNDS = Bounds(lat_min=-30.30, lat_max=-29.90, lon_min=-51.33, lon_max=-50.98)


@dataclass(frozen=True)
class Settings:
    """Runtime settings. `from_env` reads the overrides used in tests and in deployment."""

    db_path: Path = PROCESSED_DIR / "accidents.db"
    reports_dir: Path = PROCESSED_DIR
    backup_dir: Path = PROCESSED_DIR / "backup"
    # RN-01: a hotspot is a place with N or more accidents within a 100 m radius.
    # N was chosen in the exploratory analysis (notebooks/exploratory_analysis.ipynb).
    hotspot_radius_m: int = 100
    hotspot_min_accidents: int = 20

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            db_path=Path(os.environ.get("ACCIDENTS_DB_PATH", cls.db_path)),
            hotspot_min_accidents=int(os.environ.get("HOTSPOT_MIN_ACCIDENTS", cls.hotspot_min_accidents)),
        )
