# Single image: builds the front end and serves everything from the API (FastAPI serves frontend/dist).

FROM node:22-alpine AS front
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PORT=8000
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/
RUN mkdir -p data/raw data/processed

# The dataset is loaded at build time and ships inside the image. The free hosting plan wipes the disk
# whenever the service sleeps or restarts; with the database in the image, the first visit after that
# already has data instead of waiting for the slow City server. If the download fails here, the build
# goes on and docker-entrypoint.sh loads the dataset when the container starts.
# The layer is cached while backend/ does not change; to refresh the data, clear the build cache and redeploy.
WORKDIR /app/backend
RUN (python -m app.pipeline.ingest --download && rm -f /app/data/raw/*.csv) \
    || echo "Dataset download failed at build time; it will be loaded at startup."

COPY --from=front /app/frontend/dist /app/frontend/dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["docker-entrypoint.sh"]
