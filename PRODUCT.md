# Product

<!-- impeccable:product-schema 1 -->

Derivado de `docs/escopo.md` (aceito em 26/10/2026), com aprovação do dono para não repetir a entrevista.

## Platform

web

## Users

Cidadão comum de Porto Alegre, sem login, em celular ou computador. Quer saber onde e quando acontecem mais acidentes de trânsito na cidade, por curiosidade, para escolher um trajeto ou para cobrar o poder público.

## Product Purpose

Transformar a base aberta de acidentes da Prefeitura (#DataPoa / EPTC), hoje publicada só como planilha bruta, em um mapa de pontos críticos que qualquer pessoa entende. Sucesso: o visitante identifica um local e vê os números que o sustentam (quantidade, composição por gravidade e período), filtrando por período, horário, dia da semana e tipo de via.

## Positioning

Projeto de portfólio do Eduardo Ribeiro. O diferencial é o critério explícito e reproduzível de ponto crítico (N ou mais acidentes num raio de 100 m), com metodologia pública e relatório de registros descartados.

## Operating Context

- Base: CSV `cat_acidentes.csv` do #DataPoa, desde 2021, atualizada pela Prefeitura; carga manual pelo desenvolvedor por linha de comando.
- Uso típico: abrir no celular, olhar o mapa, aplicar um filtro, tocar num ponto ou no ranking.

## Capabilities and Constraints

- MVP: mapa de calor, pontos críticos clicáveis, filtros combinados (E), ranking numerado, página de metodologia, português e inglês.
- Tipo de via vem da sigla do logradouro na própria base (AV, R, ESTR; demais como "outra").
- Sem login, sem app nativo, sem previsão, sem análise de causas.
- Hospedagem gratuita; tiles do OpenStreetMap.

## Brand Commitments

- Direção visual aceita na seção 9.1 do escopo (sinalização viária, paleta de 5 cores, Barlow, ranking em faixas numeradas). É vinculante.
- Textos: botões no infinitivo; erros dizem o que aconteceu e o que fazer, sem pedido de desculpas.

## Evidence on Hand

Apenas os dados reais da base da Prefeitura. Não inventar estatísticas, depoimentos ou parcerias.

## Product Principles

1. Ocorrência registrada não é culpa nem causa (RN-06). Toda leitura forte vem com a ressalva.
2. Número sempre acompanhado do período e do critério que o produziu.
3. Transparência sobre o que ficou de fora (registros descartados e motivo).
4. Celular primeiro.

## Accessibility & Inclusion

WCAG AA de contraste, foco de teclado visível, rótulos em todos os campos, alvos de toque de 44 px, versão em tabela dos pontos críticos para leitor de tela, respeito a movimento reduzido. Lighthouse de acessibilidade 90 ou mais.
