# Imagem única: compila o front e serve tudo pela API (FastAPI serve frontend/dist).

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
COPY --from=front /app/frontend/dist frontend/dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p data/raw data/processed

WORKDIR /app/backend
EXPOSE 8000
ENTRYPOINT ["docker-entrypoint.sh"]
