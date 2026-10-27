"""In-memory copy of the latest load, shared by the services."""

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from app.domain.models import DataLoad
from app.repositories.accident_repository import AccidentRepository
from app.repositories.database import connection


class DatasetNotLoadedError(RuntimeError):
    """The database has no load yet."""

    def __init__(self) -> None:
        super().__init__("The dataset has not been loaded yet. Run python -m app.pipeline.ingest --download.")


@dataclass(frozen=True, eq=False)
class DatasetSnapshot:
    load: DataLoad
    accidents: pd.DataFrame


class AccidentDataset:
    """Valid accidents kept in memory. Reloads when the database receives a new load."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._snapshot: DatasetSnapshot | None = None

    def current(self) -> DatasetSnapshot:
        # Checked first so a request never creates an empty database file.
        if not self._db_path.exists():
            raise DatasetNotLoadedError()
        with connection(self._db_path) as conn:
            repository = AccidentRepository(conn)
            load = repository.latest_load()
            if load is None:
                raise DatasetNotLoadedError()
            if self._snapshot is None or self._snapshot.load.id != load.id:
                self._snapshot = DatasetSnapshot(load, repository.valid_accidents())
        return self._snapshot
