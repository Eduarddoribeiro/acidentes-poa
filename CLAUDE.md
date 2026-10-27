# CLAUDE.md — Acidentes de Trânsito em Porto Alegre

## Resumo do projeto

Sistema web de portfólio que mostra os pontos críticos de acidentes de trânsito em Porto Alegre, a partir da base aberta da Prefeitura (#DataPoa / EPTC). Usuário final: cidadão comum, em celular ou computador.

- **Escopo completo:** `docs/escopo.md` (status: Aceito em 26/10/2026)
- **Dono:** Eduardo Ribeiro
- **Idiomas:** português e inglês

## Stack

- **Backend:** Python, pandas para ingestão e análise, FastAPI como API em JSON, SQLite no MVP
- **Front:** React com Vite, react-leaflet, leaflet.heat, react-i18next
- **Testes:** pytest (backend), Vitest com Testing Library (front)

## Leitura obrigatória

Antes de qualquer tarefa, leia `docs/escopo.md`. Ele define o que está no MVP, o que é Fase 2 e as regras de negócio.

## Estrutura

- `backend/`: API em FastAPI, com testes em `backend/tests/`
- `frontend/`: interface em React com TypeScript e Vite, com traduções em `frontend/src/locales/`
- `data/raw/` e `data/processed/`: dados (não versionados)
- `docs/escopo.md`: escopo aceito
- `README.md`: instruções para rodar e testar

## Regras de trabalho

- **Front:** React. Não usar HTML, CSS ou JavaScript puro como base da interface.
- **Design:** seguir a seção 9.1 de `docs/escopo.md` (direção visual e de interface), aplicando a skill de design de front-end.
- **Commits:** usar a skill de commit semântico. Mensagens em português, no padrão Conventional Commits, com aprovação antes de cada commit e de cada push.
- **Atualizações:** toda mudança relevante no projeto recebe uma entrada em "Histórico de atualizações" abaixo, com data, o que mudou e o motivo.
- **Escopo:** pedidos novos depois do aceite entram na Fase 2 ou passam pela skill de nova ideia de projeto antes de serem feitos.

## Estado atual

- Fase: MVP implementado localmente (M1 a M8, M10 a M12). Falta publicar (M9, deploy) e aprovar os commits.
- Base carregada: extração de 01/10/2026, 87.323 registros, 80.175 válidos, 1.093 pontos críticos com N = 20.
- Ambiente: Python 3.12 em `backend/.venv`; Node 22. Rodar a carga com `python -m app.ingestao --baixar`.
- Decisões a confirmar com o Eduardo: N = 20 e descarte de datas posteriores à extração (escopo, seção 15).
- Próximo passo: publicar no Render (escolhido em 27/10/2026), com `render.yaml` e `Dockerfile` prontos. Falta o Eduardo criar a conta e conectar o repositório do GitHub.

## Histórico de atualizações

### 26/10/2026
- Escopo aceito. Hospedagem e ferramentas definidas como gratuitas (domínio é opcional).
- Front definido como React, com direção visual inspirada em sinalização viária (seção 9.1 do escopo).
- Repositório git iniciado na branch `main`. Commits pendentes de aprovação.
- Motivo: consolidar decisões de stack e interface antes de começar o código.
- Estrutura inicial: `.gitignore`, `README.md`, pastas de dados, API FastAPI com `/api/health` e teste, front React com TypeScript, Vite e i18n (pt-BR e en).
- Leitura obrigatória do escopo adicionada ao CLAUDE.md, para que qualquer sessão comece pelo escopo.
- Motivo: entregar o projeto pronto para continuar no terminal, começando pelo M1.

### 27/10/2026
- M1 e M2: ingestão (`backend/app/ingestao.py`) com download, validação de colunas, remoção de colunas pessoais, backup do banco e relatório de carga; limpeza (`limpeza.py`) com motivos de descarte: sem coordenada, coordenada fora de Porto Alegre, data inválida, data posterior à extração, id repetido ou ausente.
- M3: pontos críticos por raio de 100 m com agrupamento guloso em grade (`pontos_criticos.py`); API com `/api/meta`, `/api/pontos-criticos` e `/api/calor`, filtros combinados e cache.
- M8: notebook `notebooks/analise_exploratoria.ipynb`; N = 20 escolhido pela distribuição (com 30, filtros de um dia ou da noite quase zeram o mapa; com 10, 87% dos acidentes viram "críticos").
- RN-05: a base não tem tipo de via; a classificação usa a sigla do logradouro (AV, R, ESTR), com aprovação do Eduardo.
- M4, M5, M6, M7, M10, M11, M12: interface em React com mapa de calor (tiles do OpenStreetMap), placas numeradas, filtros, ranking em faixas, detalhe, metodologia, pt-BR e en. Lighthouse de acessibilidade: 97 no mapa (celular), 100 na metodologia e no desktop.
- `PRODUCT.md` e `.impeccable/` criados para a skill de design, derivados do escopo.
- M9 (parcial): README com instalação, metodologia e prints; `Dockerfile` que compila o front e serve tudo pela API.
- Deploy: Render no plano gratuito, escolhido pelo Eduardo. A API sobe na hora e carrega a base em segundo plano, porque o Render espera a porta abrir em poucos minutos.
- Motivo: entregar o MVP completo para revisão antes do deploy.

