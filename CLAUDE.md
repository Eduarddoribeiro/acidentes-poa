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

- `backend/app/`: FastAPI em camadas: `core` (configuração), `domain` (regras puras), `repositories` (SQLite), `services` (casos de uso), `api` (rotas e schemas) e `pipeline` (ingestão). Testes em `backend/tests/unit` e `backend/tests/integration`.
- `frontend/src/`: React com TypeScript e Vite. `app/` (shell), `features/` (uma pasta por funcionalidade, com componente, CSS Module e teste), `shared/` (api, hooks, i18n, lib, styles, ui). Traduções em `frontend/src/shared/i18n/locales/`.
- `data/raw/` e `data/processed/`: dados (não versionados)
- `docs/escopo.md`: escopo aceito
- `README.md`: instruções para rodar e testar

## Regras de trabalho

- **Front:** React. Não usar HTML, CSS ou JavaScript puro como base da interface. Estilos em CSS Modules ao lado do componente; tokens em `shared/styles/tokens.css`.
- **Idioma do código:** inglês (pastas, arquivos, identificadores, rotas e campos da API, colunas do banco, comentários e testes). Interface em pt-BR e en; documentação e commits em português.
- **Camadas:** dependências em uma direção só (`api` → `services` → `repositories` → `domain`); no front, `shared` não importa de `features`.
- **Design:** seguir a seção 9.1 de `docs/escopo.md` (direção visual e de interface), aplicando a skill de design de front-end.
- **Commits:** usar a skill de commit semântico. Mensagens em português, no padrão Conventional Commits, com aprovação antes de cada commit e de cada push.
- **Atualizações:** toda mudança relevante no projeto recebe uma entrada em "Histórico de atualizações" abaixo, com data, o que mudou e o motivo.
- **Escopo:** pedidos novos depois do aceite entram na Fase 2 ou passam pela skill de nova ideia de projeto antes de serem feitos.

## Estado atual

- Fase: MVP completo (M1 a M12), versionado no GitHub (`Eduarddoribeiro/acidentes-poa`) e publicado em https://acidentes-poa.onrender.com.
- Base carregada: extração de 01/10/2026, 87.323 registros, 80.175 válidos, 1.093 pontos críticos com N = 20.
- Ambiente: Python 3.12 em `backend/.venv`; Node 22 (Vite 8 exige 22.12 ou mais novo). Rodar a carga com `python -m app.pipeline.ingest --download`.
- Decisões confirmadas pelo Eduardo: N = 20 e descarte de datas posteriores à extração (escopo, seção 15).
- Deploy: Render, plano gratuito, serviço `acidentes-poa` gerenciado pelo Blueprint (`render.yaml`), com deploy automático a cada push na `main`. A instância dorme sem uso e leva cerca de 1 minuto para acordar.
- Próximo passo: itens da Fase 2 (escopo, seção 7), sempre passando pela regra de escopo.

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

### 27/10/2026 (revisão antes do deploy)
- Eduardo confirmou N = 20 e o descarte de registros com data posterior à extração; escopo (seção 15) atualizado.
- Ferramentas de desenvolvimento do front atualizadas (Vite 5 → 8, Vitest 2 → 5, @vitejs/plugin-react 4 → 6, jest-dom 6 → 7); `vite.config.ts` passou a usar `defineConfig` de `vitest/config`. `npm audit` sem vulnerabilidades; build e 23 testes passando.
- Dockerfile passou de `node:20-alpine` para `node:22-alpine` (Node 20 fora de suporte desde abril de 2026); README atualizado.
- Motivo: fechar as pendências do MVP e eliminar 6 vulnerabilidades (2 críticas) antes de publicar.

### 27/10/2026 (deploy)
- M9 concluído: sistema publicado no Render em https://acidentes-poa.onrender.com, pelo Blueprint do repositório (commit `f294da6`). Conferido: `/api/health` ok, `/api/meta` com 80.175 registros aceitos, mapa, filtros e ranking funcionando.
- README com a URL pública e o aviso sobre a demora na primeira visita do plano gratuito.
- Motivo: fechar o MVP com o sistema acessível em uma URL pública.

### 27/10/2026 (refatoração da arquitetura)
- Código passou para inglês, com aprovação do Eduardo: pastas, arquivos, identificadores, rotas da API (`/api/metadata`, `/api/hotspots`, `/api/heatmap`), parâmetros (`start`, `end`, `hour_start`, `hour_end`, `weekdays`, `road_types`), campos do JSON, colunas do banco (`accident`, `data_load`), variáveis de ambiente (`ACCIDENTS_DB_PATH`, `HOTSPOT_MIN_ACCIDENTS`) e o notebook (`notebooks/exploratory_analysis.ipynb`). Textos da interface, documentação e commits seguem em português.
- Backend em camadas (`core`, `domain`, `repositories`, `services`, `api`, `pipeline`), com `create_app(settings)` e injeção de dependências do FastAPI no lugar de estado global; schemas Pydantic documentam o contrato em `/docs`. Testes separados em `unit` e `integration`.
- Front por funcionalidade (`app`, `features`, `shared`): o `PainelPrincipal` de 274 linhas virou `DashboardPage` com os hooks `useMapData`, `useHotspotSelection` e `useSheetHeight` e os componentes `ResultsPanel` e `ResultsContent`; o mapa foi dividido em camada de calor, marcadores, enquadramento e legenda; o CSS global de 1.012 linhas virou tokens, estilos base e um CSS Module por componente; botões, aviso, carregando e erro viraram componentes em `shared/ui`; os dois hooks de carregamento passaram a usar `useAsyncResource`.
- Mudança visível só em inglês: um ponto sem nome de rua aparecia como "Local sem nome na base"; agora a API manda `name: null` e a interface traduz. O endereço antigo `#/metodologia` continua funcionando.
- Conferido: as respostas da API nova são idênticas às da antiga em três recortes (1.093 pontos no padrão), as saídas do notebook têm os mesmos números, 47 testes no backend e 25 no front passam, e a interface foi checada no navegador (desktop, celular a 390 px, gaveta de filtros, detalhe, inglês e metodologia).
- Motivo: deixar o projeto de portfólio no padrão de mercado, com código em inglês e arquitetura em camadas e por funcionalidade.

### 27/10/2026 (meses recentes sem pontos críticos)
- Diagnóstico: filtrar um mês ou um trimestre zera o ranking porque a RN-01 pede 20 acidentes no mesmo raio de 100 m em qualquer período. Em set/2026 há 937 acidentes no mapa, mas o local mais concentrado tem 7. Em 2026 a cobertura de coordenadas também é menor (76% a 83%), e setembro tem menos registros, talvez por lançamentos atrasados.
- A mensagem de recorte vazio agora diz quantos acidentes há no recorte, explica por que nenhum vira ponto crítico e lembra que o mapa de calor continua mostrando os acidentes. Sem acidentes, diz isso.
- N proporcional ao período registrado como F6 na Fase 2 do escopo, para avaliar com a skill de nova ideia.
- Motivo: o recorte vazio parecia erro ou falta de dados, quando é efeito da regra.

### 27/10/2026 (antes de divulgar)
- Base dentro da imagem Docker: o build roda a ingestão e grava o banco na imagem. No plano gratuito, o disco é apagado quando o serviço dorme ou reinicia, e a primeira visita depois disso esperava a base ser baixada de novo do servidor lento da Prefeitura. Se o download falhar no build, o `docker-entrypoint.sh` continua carregando a base ao subir. Para atualizar a base publicada: "Clear build cache & deploy" no Render.
- Plural do zero em português: "0 local com 20 ou mais" virou "Nenhum local com 20 ou mais"; o total do recorte vazio virou "Nenhum acidente no recorte".
- Motivo: preparar o projeto para ser divulgado no LinkedIn, onde a primeira visita costuma chegar com o serviço dormindo.
