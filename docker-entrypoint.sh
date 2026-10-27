#!/bin/sh
# Starts the API right away. If there is no database yet, downloads and loads the dataset in the background:
# the City's server is slow, and the hosting provider expects the port to open within a few minutes.
# Until the load finishes, the API answers 503 and the interface shows the error state with "Try again".
set -e

if [ ! -f "${ACCIDENTS_DB_PATH:-/app/data/processed/accidents.db}" ]; then
  echo "Database not found. Loading the dataset in the background."
  python -m app.pipeline.ingest --download &
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
