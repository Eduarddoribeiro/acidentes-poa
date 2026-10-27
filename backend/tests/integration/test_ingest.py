import json
import sqlite3

from app.pipeline import ingest
from tests.factories import SOURCE_HEADER, source_row


def test_load_writes_report_with_accepted_and_discarded(write_csv, settings, tmp_path) -> None:
    source = write_csv([source_row("1"), source_row("2"), source_row("3", lat=""), source_row("4", date="x")])

    report = ingest.run_ingestion(source, settings)

    assert report["total_read"] == 4
    assert report["total_accepted"] == 2
    assert report["discards_by_reason"] == {"missing_coordinates": 1, "invalid_date": 1}
    assert report["extracted_at"] == "2026-10-01"
    saved = json.loads((tmp_path / f"load_report_{report['load_id']}.json").read_text(encoding="utf-8"))
    assert saved["total_discarded"] == 2

    conn = sqlite3.connect(settings.db_path)
    by_status = dict(conn.execute("SELECT status, COUNT(*) FROM accident GROUP BY status").fetchall())
    conn.close()
    assert by_status == {"valid": 2, "discarded": 2}


def test_new_load_replaces_the_previous_one_and_backs_it_up(write_csv, settings) -> None:
    ingest.run_ingestion(write_csv([source_row("1"), source_row("2")]), settings)

    report = ingest.run_ingestion(write_csv([source_row("1")], "new.csv"), settings)

    conn = sqlite3.connect(settings.db_path)
    accidents = conn.execute("SELECT COUNT(*) FROM accident").fetchone()[0]
    loads = conn.execute("SELECT COUNT(*) FROM data_load").fetchone()[0]
    conn.close()
    assert accidents == 1
    assert loads == 2
    assert report["backup"] is not None
    assert list(settings.backup_dir.glob("*.db"))


def test_cli_stops_when_columns_are_missing(tmp_path, settings, capsys) -> None:
    source = tmp_path / "wrong.csv"
    source.write_text("a;b\n1;2\n", encoding="utf-8")

    exit_code = ingest.main([str(source)], settings)

    assert exit_code == 2
    assert "Missing columns" in capsys.readouterr().err


def test_reads_latin1_file(tmp_path) -> None:
    source = tmp_path / "latin1.csv"
    source.write_bytes(("\n".join([SOURCE_HEADER, source_row("1")]) + "\n").encode("latin-1"))

    assert ingest.read_source_csv(source).iloc[0]["tipo_acid"] == "COLISÃO"
