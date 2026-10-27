"""Persistence of data loads and accidents."""

import json
import sqlite3

import pandas as pd

from app.domain.models import DataLoad, Status

ACCIDENT_COLUMNS = [
    "source_id",
    "date",
    "time",
    "weekday",
    "latitude",
    "longitude",
    "street",
    "cross_street",
    "road_type",
    "accident_type",
    "region",
    "severity",
    "status",
    "discard_reason",
    "raw",
]

DATA_LOAD_COLUMNS = [
    "id",
    "source_file",
    "loaded_at",
    "total_read",
    "total_accepted",
    "total_discarded",
    "discards_by_reason",
    "extracted_at",
]


class AccidentRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def save_load(
        self,
        cleaned: pd.DataFrame,
        source_file: str,
        loaded_at: str,
        summary: dict,
        extracted_at: str | None,
    ) -> int:
        """Replaces the accidents with the new load and records the load. Returns the load id."""
        with self._conn:
            cursor = self._conn.execute(
                "INSERT INTO data_load (source_file, loaded_at, total_read, total_accepted, total_discarded,"
                " discards_by_reason, extracted_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    source_file,
                    loaded_at,
                    summary["total_read"],
                    summary["total_accepted"],
                    summary["total_discarded"],
                    json.dumps(summary["discards_by_reason"], ensure_ascii=False),
                    extracted_at,
                ),
            )
            load_id = int(cursor.lastrowid)
            self._conn.execute("DELETE FROM accident")

            table = cleaned[ACCIDENT_COLUMNS].copy()
            table["date"] = table["date"].dt.strftime("%Y-%m-%d")
            table["load_id"] = load_id
            table["source_file"] = source_file
            table = table.astype(object).where(table.notna(), None)
            columns = list(table.columns)
            self._conn.executemany(
                f"INSERT INTO accident ({', '.join(columns)}) VALUES ({', '.join('?' * len(columns))})",
                table.itertuples(index=False, name=None),
            )
        return load_id

    def latest_load(self) -> DataLoad | None:
        row = self._conn.execute(
            f"SELECT {', '.join(DATA_LOAD_COLUMNS)} FROM data_load ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if row is None:
            return None
        values = dict(zip(DATA_LOAD_COLUMNS, row))
        values["discards_by_reason"] = json.loads(values["discards_by_reason"])
        return DataLoad(**values)

    def valid_accidents(self) -> pd.DataFrame:
        """Valid accidents, ready for filtering and hotspot computation."""
        df = pd.read_sql_query(
            "SELECT id, date, time, weekday, latitude, longitude, street, cross_street, road_type, region, severity"
            " FROM accident WHERE status = ?",
            self._conn,
            params=(Status.VALID.value,),
        )
        df["date"] = pd.to_datetime(df["date"])
        df["hour"] = pd.to_numeric(df["time"].str.slice(0, 2), errors="coerce")
        return df
