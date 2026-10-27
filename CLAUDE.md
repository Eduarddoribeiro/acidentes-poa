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

## Regras de trabalho

- **Front:** React. Não usar HTML, CSS ou JavaScript puro como base da interface.
- **Design:** seguir a seção 9.1 de `docs/escopo.md` (direção visual e de interface), aplicando a skill de design de front-end.
- **Commits:** usar a skill de commit semântico. Mensagens em português, no padrão Conventional Commits, com aprovação antes de cada commit e de cada push.
- **Atualizações:** toda mudança relevante no projeto recebe uma entrada em "Histórico de atualizações" abaixo, com data, o que mudou e o motivo.
- **Escopo:** pedidos novos depois do aceite entram na Fase 2 ou passam pela skill de nova ideia de projeto antes de serem feitos.

## Estado atual

- Fase: planejamento concluído, aguardando início do M1 (ingestão da base).
- Próximo passo: baixar a base da Prefeitura e verificar colunas, cobertura de coordenadas e período.

## Histórico de atualizações

### 26/10/2026
- Escopo aceito. Hospedagem e ferramentas definidas como gratuitas (domínio é opcional).
- Front definido como React, com direção visual inspirada em sinalização viária (seção 9.1 do escopo).
- Repositório git iniciado na branch `main`. Commits pendentes de aprovação.
- Motivo: consolidar decisões de stack e interface antes de começar o código.
