#!/bin/sh
# Sobe a API na hora. Se ainda não houver banco, baixa e carrega a base em segundo plano:
# o servidor da Prefeitura é lento, e o provedor de hospedagem espera a porta abrir em poucos minutos.
# Enquanto a carga não termina, a API responde 503 e a interface mostra o estado de erro com "Tentar de novo".
set -e

if [ ! -f "${ACIDENTES_DB:-/app/data/processed/acidentes.db}" ]; then
  echo "Banco não encontrado. Carregando a base em segundo plano."
  python -m app.ingestao --baixar &
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
