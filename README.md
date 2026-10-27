# Acidentes de trânsito em Porto Alegre

Sistema web que mostra os pontos críticos de acidentes de trânsito em Porto Alegre, a partir da base aberta da Prefeitura (#DataPoa / EPTC). Projeto de portfólio, com interface em português e inglês.

> Status: estrutura inicial. A ingestão da base (M1) ainda não começou.

## Documentação

- [Escopo completo](docs/escopo.md): visão, regras de negócio, MVP, Fase 2, stack e direção visual.
- [CLAUDE.md](CLAUDE.md): resumo do projeto, regras de trabalho e histórico de atualizações.

## Estrutura

```
backend/        API em FastAPI (Python)
  app/          código da aplicação
  tests/        testes com pytest
frontend/       interface em React, TypeScript e Vite
  src/          componentes, traduções e estilos
data/
  raw/          base baixada da Prefeitura (não versionada)
  processed/    dados tratados (não versionados)
docs/           escopo do projeto
```

## Como rodar

Requisitos: Python 3.11 ou mais novo, Node.js 20 ou mais novo.

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # no Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API responde em `http://localhost:8000/api/health`.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

## Testes

```bash
# backend
cd backend && pytest

# frontend
cd frontend && npm test
```

## Licença e dados

Os dados de acidentes vêm da Prefeitura de Porto Alegre, sob os termos de uso do portal #DataPoa. Confira a licença do conjunto de dados antes de redistribuí-lo.
