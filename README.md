# Acidentes de trânsito em Porto Alegre

Sistema web que mostra os pontos críticos de acidentes de trânsito em Porto Alegre, a partir da base aberta da Prefeitura (#DataPoa / EPTC). Projeto de portfólio, com interface em português e inglês.

**No ar:** https://acidentes-poa.onrender.com (plano gratuito do Render: depois de um tempo parado, a primeira visita pode levar cerca de um minuto para carregar).

![Painel no desktop: filtros e ranking à esquerda, mapa de calor com os pontos críticos numerados](docs/prints/desktop.png)

<p>
  <img src="docs/prints/celular.png" alt="Mapa no celular com a folha de ranking" width="240">
  <img src="docs/prints/celular-detalhe.png" alt="Detalhe de um ponto crítico no celular" width="240">
  <img src="docs/prints/celular-filtros.png" alt="Gaveta de filtros no celular" width="240">
</p>

## O que o sistema faz

- Mapa de calor com os 80 mil acidentes registrados desde 2021 e os pontos críticos numerados.
- Filtros de período, horário, dia da semana e tipo de via, que combinam entre si.
- Ranking dos locais mais críticos, do maior para o menor número de acidentes, com "ver no mapa".
- Detalhe de cada ponto: quantidade, composição (sem vítimas, com feridos, com mortos) e período.
- Página de metodologia com fonte, critério, registros descartados e ressalva de uso.
- Celular primeiro: folha de ranking com três alturas e gaveta de filtros. No desktop, painel fixo à esquerda.

## Metodologia

- **Fonte:** conjunto [Acidentes de Trânsito – Acidentes](https://dadosabertos.poa.br/dataset/acidentes-de-transito-acidentes) do #DataPoa. Extração usada: 01/10/2026, com 87.323 registros de 01/01/2021 a 30/09/2026.
- **Limpeza:** 7.148 registros (8,2%) ficam fora do mapa. São 7.144 sem coordenada e 4 com data posterior à extração. Cada descarte fica salvo no banco com o motivo e o registro original.
- **Ponto crítico (RN-01):** local com 20 ou mais acidentes num raio de 100 m. O cálculo começa pelo acidente com mais vizinhos, forma o ponto e retira esses acidentes da disputa. Assim, cada acidente conta em um único ponto. O valor 20 saiu da [análise exploratória](notebooks/analise_exploratoria.ipynb).
- **Tipo de via:** a base não tem esse campo. A classificação usa a sigla do logradouro (AV, R, ESTR).
- **Gravidade:** campo UPS da EPTC (1 sem vítimas, 5 com feridos, 13 com mortos).
- **Ressalva:** os dados mostram ocorrências registradas. Um ponto alto indica concentração de registros, não culpa de condutores nem causa. O mapa não considera o volume de trânsito.

## Estrutura

```
backend/           API em FastAPI e pipeline de dados (Python)
  app/
    ingestao.py    baixa, valida e grava a base; gera relatório de carga
    limpeza.py     padronização e regras de descarte
    pontos_criticos.py  agrupamento por raio
    consultas.py   filtros e mapa de calor
    main.py        rotas da API
  tests/           testes com pytest
frontend/          interface em React, TypeScript e Vite
  src/components/  mapa, filtros, ranking, detalhe, metodologia
  src/locales/     traduções pt-BR e en
  src/test/        testes com Vitest e Testing Library
notebooks/         análise exploratória (M8)
data/
  raw/             base baixada da Prefeitura (não versionada)
  processed/       banco SQLite, relatórios de carga e backups (não versionados)
docs/              escopo do projeto e prints
```

## Como rodar

Requisitos: Python 3.11 ou mais novo, Node.js 22.12 ou mais novo.

**1. Backend e carga da base**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # no Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.ingestao --baixar  # baixa a base e grava em data/processed/acidentes.db
uvicorn app.main:app --reload
```

O servidor da Prefeitura é lento: o download de cerca de 18 MB pode levar vários minutos. Se a base já estiver em `data/raw/cat_acidentes.csv`, rode só `python -m app.ingestao`. Cada carga gera `data/processed/relatorio_carga_<n>.json` e faz backup do banco anterior.

A API responde em `http://localhost:8000`:

| Rota | O que devolve |
|---|---|
| `GET /api/health` | situação da API |
| `GET /api/meta` | fonte, período, critério, descartes e tipos de via |
| `GET /api/pontos-criticos` | pontos críticos ordenados |
| `GET /api/calor` | pontos do mapa de calor `[latitude, longitude, quantidade]` |

Filtros aceitos nas duas últimas: `inicio` e `fim` (AAAA-MM-DD), `hora_inicio` e `hora_fim` (horas cheias; `22` e `2` passam da meia-noite), `dias` (`0` = segunda a `6` = domingo, separados por vírgula) e `vias` (`avenida,rua,estrada,outra`).

**2. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. O Vite encaminha `/api` para o backend.

**3. Análise exploratória (opcional)**

```bash
cd backend
pip install -r requirements-dev.txt
jupyter notebook ../notebooks/analise_exploratoria.ipynb
```

## Testes

```bash
cd backend && pytest      # ingestão, limpeza, pontos críticos, filtros e API
cd frontend && npm test   # filtros, componentes e estados da interface
```

## Configuração

| Variável | Padrão | Uso |
|---|---|---|
| `ACIDENTES_DB` | `data/processed/acidentes.db` | caminho do banco SQLite |
| `ACIDENTES_N_MINIMO` | `20` | N da RN-01 |

## Publicar no Render (plano gratuito)

O `Dockerfile` compila o front e serve tudo pela API, numa imagem só. O `render.yaml` descreve o serviço.

1. Envie o repositório para o GitHub.
2. Em [render.com](https://render.com), crie a conta e escolha **New > Blueprint**, apontando para o repositório.
3. Na primeira subida, a API abre na hora e a base é baixada e carregada em segundo plano. Até a carga terminar, a interface mostra "Os dados não carregaram" com o botão "Tentar de novo".

Limitações do plano gratuito: o serviço dorme após 15 minutos sem acesso (leva cerca de 1 minuto para acordar), e o disco é apagado a cada deploy ou reinício, então a base é baixada de novo. Se o servidor da Prefeitura estiver lento, mantenha a página aberta durante a primeira carga para o serviço não dormir no meio dela.

Para testar a imagem localmente:

```bash
docker build -t acidentes-poa .
docker run -p 8000:8000 acidentes-poa   # abra http://localhost:8000
```

## Licença e dados

Os dados de acidentes vêm da Prefeitura de Porto Alegre, sob os termos de uso do portal #DataPoa. Confira a licença do conjunto de dados antes de redistribuí-lo. Mapa base © colaboradores do OpenStreetMap.
