"""Ingestion pipeline for the accident dataset (M1).

Usage, from the backend folder:

    python -m app.pipeline.ingest --download     # downloads the latest dataset and loads it
    python -m app.pipeline.ingest path/to/file.csv

Writes a load report to data/processed/ with accepted and discarded records by reason.
"""

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

import httpx
import pandas as pd

from app.core.config import RAW_DIR, SOURCE_CSV_URL, SOURCE_FILE_NAME, Settings
from app.domain import cleaning
from app.domain.models import Status
from app.repositories.accident_repository import AccidentRepository
from app.repositories.database import connection


def download(destination: Path, url: str = SOURCE_CSV_URL) -> Path:
    """Downloads the City's dataset. The server is slow, so the timeout is long."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_suffix(".partial")
    with httpx.stream("GET", url, timeout=httpx.Timeout(60, read=600), follow_redirects=True) as response:
        response.raise_for_status()
        with partial.open("wb") as file:
            for chunk in response.iter_bytes():
                file.write(chunk)
    partial.replace(destination)
    return destination


def read_source_csv(path: Path) -> pd.DataFrame:
    """Reads the City's CSV (';' separator). Tries UTF-8 and falls back to Latin-1."""
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            return pd.read_csv(path, sep=";", dtype=str, encoding=encoding, keep_default_na=False)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not read {path}")


def _extraction_date(raw: pd.DataFrame) -> str | None:
    if "data_extracao" not in raw.columns:
        return None
    dates = pd.to_datetime(raw["data_extracao"], errors="coerce").dropna()
    return dates.max().strftime("%Y-%m-%d") if not dates.empty else None


def back_up_database(db_path: Path, backup_dir: Path) -> Path | None:
    """Copies the current database before a new load (section 11 of the scope)."""
    if not db_path.exists():
        return None
    backup_dir.mkdir(parents=True, exist_ok=True)
    destination = backup_dir / f"{db_path.stem}_{datetime.now():%Y%m%d_%H%M%S}.db"
    shutil.copy2(db_path, destination)
    return destination


def run_ingestion(source: Path, settings: Settings) -> dict:
    """Reads, validates, cleans and stores the dataset. Returns the load report."""
    raw = read_source_csv(source)
    cleaning.validate_columns(raw)
    _, personal_columns = cleaning.drop_personal_data(raw)
    cleaned = cleaning.clean(raw)
    summary = cleaning.summarize(cleaned)

    valid = cleaned[cleaned["status"] == Status.VALID]
    report = {
        "source_file": source.name,
        "loaded_at": datetime.now().isoformat(timespec="seconds"),
        "extracted_at": _extraction_date(raw),
        **summary,
        "period": {
            "start": valid["date"].min().strftime("%Y-%m-%d") if not valid.empty else None,
            "end": valid["date"].max().strftime("%Y-%m-%d") if not valid.empty else None,
        },
        "personal_columns_dropped": personal_columns,
    }

    backup = back_up_database(settings.db_path, settings.backup_dir)
    report["backup"] = str(backup) if backup else None
    with connection(settings.db_path) as conn:
        report["load_id"] = AccidentRepository(conn).save_load(
            cleaned, source.name, report["loaded_at"], summary, report["extracted_at"]
        )

    settings.reports_dir.mkdir(parents=True, exist_ok=True)
    report_path = settings.reports_dir / f"load_report_{report['load_id']}.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    report["report_path"] = str(report_path)
    return report


def _print_report(report: dict) -> None:
    print(f"Load {report['load_id']} from {report['source_file']}")
    print(f"  period: {report['period']['start']} to {report['period']['end']}")
    print(f"  read: {report['total_read']}")
    print(f"  accepted: {report['total_accepted']} ({report['accepted_without_time']} without time)")
    print(f"  discarded: {report['total_discarded']}")
    for reason, count in report["discards_by_reason"].items():
        print(f"    {reason}: {count}")
    print(f"  report: {report['report_path']}")


def main(argv: list[str] | None = None, settings: Settings | None = None) -> int:
    settings = settings or Settings.from_env()
    parser = argparse.ArgumentParser(description="Loads the City's accident dataset into the database.")
    parser.add_argument("source", nargs="?", type=Path, default=RAW_DIR / SOURCE_FILE_NAME)
    parser.add_argument("--download", action="store_true", help="download the latest dataset before loading")
    args = parser.parse_args(argv)

    if args.download:
        print(f"Downloading {SOURCE_CSV_URL}")
        download(args.source)
    if not args.source.exists():
        print(f"File not found: {args.source}. Use --download or pass a path.", file=sys.stderr)
        return 1
    try:
        report = run_ingestion(args.source, settings)
    except cleaning.MissingColumnsError as error:
        print(f"Load stopped. {error}. Check that the file is the EPTC accident dataset.", file=sys.stderr)
        return 2
    _print_report(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
