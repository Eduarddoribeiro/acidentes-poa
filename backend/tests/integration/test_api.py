import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.pipeline import ingest
from tests.factories import source_row


@pytest.fixture
def client(write_csv, settings) -> TestClient:
    """API over a temporary database with 12 clustered accidents, 2 isolated ones and 2 discarded."""
    rows = [source_row(str(i), lat=f"{-30.0346 + i * 0.00002:.6f}") for i in range(12)]
    rows += [
        source_row("100", lat="-30.10", lon="-51.20", date="2025-06-07 00:00:00", time="23:10:00.0000000"),
        source_row("101", lat="-30.12", lon="-51.20", date="2021-02-01 00:00:00", street="R DA REPUBLICA"),
        source_row("200", lat=""),
        source_row("201", date="bad date"),
    ]
    ingest.run_ingestion(write_csv(rows), settings)
    return TestClient(create_app(settings))


def test_health_returns_ok() -> None:
    response = TestClient(create_app()).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_metadata_reports_criteria_period_and_discards(client) -> None:
    response = client.get("/api/metadata")

    assert response.status_code == 200
    data = response.json()
    assert data["criteria"] == {"radius_meters": 100, "min_accidents": 10}
    assert data["load"]["total_discarded"] == 2
    assert data["load"]["percent_missing_coordinates"] == 6.2
    assert data["dataset_period"] == {"start": "2021-02-01", "end": "2025-06-07"}
    assert data["road_types"] == {"avenue": 13, "street": 1}


def test_hotspots(client) -> None:
    hotspots = client.get("/api/hotspots").json()["hotspots"]

    assert len(hotspots) == 1
    assert hotspots[0]["total"] == 12
    assert hotspots[0]["rank"] == 1
    assert hotspots[0]["name"] == "Av. Borges de Medeiros"
    assert hotspots[0]["first_date"] == "2024-03-02"


def test_heatmap_respects_filters(client) -> None:
    everything = client.get("/api/heatmap").json()
    night = client.get("/api/heatmap", params={"hour_start": 22, "hour_end": 2}).json()
    streets = client.get("/api/heatmap", params={"road_types": "street"}).json()

    assert everything["total"] == 14
    assert night["total"] == 1
    assert streets["total"] == 1
    assert sum(p[2] for p in everything["points"]) == 14


def test_invalid_filter_returns_422(client) -> None:
    assert client.get("/api/heatmap", params={"weekdays": "9"}).status_code == 422
    assert client.get("/api/heatmap", params={"weekdays": "x"}).status_code == 422
    assert client.get("/api/heatmap", params={"road_types": "bike_lane"}).status_code == 422
    assert client.get("/api/heatmap", params={"hour_start": 30}).status_code == 422


def test_without_dataset_returns_503(tmp_path) -> None:
    client = TestClient(create_app(Settings(db_path=tmp_path / "missing.db")))

    response = client.get("/api/metadata")

    assert response.status_code == 503
    assert "app.pipeline.ingest" in response.json()["detail"]
    assert not (tmp_path / "missing.db").exists()
