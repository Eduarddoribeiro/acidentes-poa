"""SQLite connection and schema."""

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS data_load (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file TEXT NOT NULL,
    loaded_at TEXT NOT NULL,
    total_read INTEGER NOT NULL,
    total_accepted INTEGER NOT NULL,
    total_discarded INTEGER NOT NULL,
    discards_by_reason TEXT NOT NULL,
    extracted_at TEXT
);

CREATE TABLE IF NOT EXISTS accident (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    load_id INTEGER NOT NULL REFERENCES data_load(id),
    source_id INTEGER,
    date TEXT,
    time TEXT,
    weekday INTEGER,
    latitude REAL,
    longitude REAL,
    street TEXT,
    cross_street TEXT,
    road_type TEXT,
    accident_type TEXT,
    region TEXT,
    severity TEXT,
    source_file TEXT NOT NULL,
    status TEXT NOT NULL,
    discard_reason TEXT,
    raw TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accident_status ON accident(status);
"""


def connect(db_path: Path) -> sqlite3.Connection:
    """Opens the database, creating the file and the tables if needed."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA)
    return conn


@contextmanager
def connection(db_path: Path) -> Iterator[sqlite3.Connection]:
    conn = connect(db_path)
    try:
        yield conn
    finally:
        conn.close()
