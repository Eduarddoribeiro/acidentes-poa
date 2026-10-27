---
name: Acidentes de Trânsito em Porto Alegre
description: Mapa dos pontos críticos de acidentes de Porto Alegre, lido como uma placa de rua.
colors:
  paper: "#eef0ec"
  ink: "#1b2a33"
  slate: "#5c6b73"
  selection-blue: "#1f5a8a"
  slate-soft: "#d7dbd9"
  slate-line: "#acb4b6"
  blue-soft: "#d5dee0"
  ink-hover: "#3b484f"
  heat-1: "#fbe3a1"
  heat-2: "#f2b263"
  heat-3: "#dc6b33"
  heat-4: "#b02e26"
  heat-5: "#7a0f1f"
typography:
  display:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  title-sm:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.2
  numero:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "tnum"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  nota:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  placa-mapa:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  placa: "4px"
  miuda: "2px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  alvo: "44px"
  cabecalho: "56px"
  painel: "360px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.placa}"
    padding: "0 16px"
    height: "{spacing.alvo}"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.placa}"
    padding: "0 16px"
    height: "{spacing.alvo}"
  button-secondary-hover:
    backgroundColor: "{colors.slate-soft}"
  button-icon:
    backgroundColor: "transparent"
    rounded: "{rounded.placa}"
    size: "{spacing.alvo}"
  button-icon-hover:
    backgroundColor: "{colors.slate-soft}"
  chip-opcao:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.placa}"
    padding: "0 12px"
    height: "{spacing.alvo}"
  chip-opcao-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  input-campo:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.placa}"
    padding: "0 10px"
    height: "{spacing.alvo}"
  faixa-ranking:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "8px 16px"
    height: "56px"
  faixa-ranking-active:
    backgroundColor: "{colors.blue-soft}"
  faixa-numero:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.numero}"
    rounded: "{rounded.placa}"
    size: "40px"
  faixa-numero-active:
    backgroundColor: "{colors.selection-blue}"
  marcador-mapa:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.placa-mapa}"
    rounded: "{rounded.placa}"
    size: "28px"
  marcador-mapa-active:
    backgroundColor: "{colors.selection-blue}"
  cabecalho:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    height: "{spacing.cabecalho}"
    padding: "0 8px 0 16px"
---

# Design System: Acidentes de Trânsito em Porto Alegre

## Overview

**Creative North Star: "A Placa de Rua"**

A interface é lida como sinalização viária: informação direta, leitura rápida, nada decorativo. Os dados são o conteúdo. O mapa da cidade ocupa a tela, o calor dos acidentes fica à frente de um mapa-base desbotado em cinza, e tudo o que é texto ou controle se comporta como placa: tinta escura sobre papel frio, uma única família tipográfica, números tabulares, cantos levemente arredondados como chapa estampada.

A densidade é de painel de consulta, não de página de marketing. No celular, o mapa é tela cheia e o ranking sobe numa folha inferior; no desktop, um painel fixo de 360 px à esquerda carrega filtros e ranking. A hierarquia vem de peso e tamanho do tipo, de blocos de tinta sólida e de filetes finos, nunca de sombras, cartões ou gradientes de interface. A única cor quente da interface é a escala de calor, e ela pertence aos dados.

Rejeições confirmadas (escopo, seção 9.1, revisão do desenho): azul-petróleo de painel genérico, cartões com sombra e rótulos em caixa-alta.

**Key Characteristics:**
- Papel frio, tinta azul-escura e um cinza-azulado; azul só para seleção e foco.
- Escala de calor sequencial de 5 passos, reservada a dados (mapa, legenda, composição, erro).
- Barlow em 400, 600 e 700, com números tabulares em toda quantidade.
- Placas numeradas: blocos de tinta com número claro, no ranking e no mapa.
- Plano: sem sombras, sem cartões; filetes de 1 px separam conteúdo, filetes de 2 px em tinta separam regiões.
- Alvos de toque de 44 px em todos os controles.

## Colors

Paleta de placa: três neutros frios, um azul funcional e uma escala de calor que só aparece quando há dado para mostrar.

### Primary
- **Tinta de Placa** (ink): texto principal, fundo do cabeçalho, botão primário, opção marcada, número das faixas e placas do mapa, filetes estruturais de 2 px. É a cor que "pinta" a placa.

### Secondary
- **Azul de Seleção** (selection-blue): exclusivamente estado ativo e foco. Ponto selecionado (placa do mapa e número da faixa), anel de foco de 3 px, links, seleção de texto, `accent-color`. Nunca decora.
- **Azul Suave** (blue-soft): fundo da faixa ativa no ranking; mistura de 12% do azul de seleção sobre o papel.

### Tertiary
- **Escala de Calor** (heat-1 a heat-5): sequência amarelo-palha, laranja, terracota, vermelho, vinho, legível para daltônicos. Pinta a camada de calor do mapa (paradas em 0,15 / 0,4 / 0,6 / 0,8 / 1), a faixa da legenda, a barra de composição do detalhe (heat-1 sem vítimas, heat-3 feridos, heat-5 mortos) e as amostras da lista.
- **Vinho** (heat-5) dobra como cor de erro: mensagem de erro de filtro e título do aviso de erro de carga.

### Neutral
- **Papel Frio** (paper): fundo de tudo, texto sobre tinta, contorno das placas do mapa.
- **Cinza-Azulado** (slate): texto secundário (resumos, rótulos de campo, dicas, ressalvas), borda de campos e opções, alça da folha inferior.
- **Cinza de Filete** (slate-line): divisórias de 1 px entre faixas, linhas de lista e tabela, borda da legenda e do controle de zoom, borda de botão desativado; mistura de 45% do cinza sobre o papel.
- **Cinza Suave** (slate-soft): hover de botões secundários, de ícone, de faixas e de opções; blocos de carregamento; mistura de 16% do cinza sobre o papel.
- **Tinta Clara** (ink-hover): hover do botão primário (85% tinta, 15% papel).

Os derivados (slate-soft, slate-line, blue-soft, ink-hover) são declarados no código com `color-mix(in srgb, ...)` sobre os tokens de base; os hex acima são a resolução desses valores.

### Named Rules
**A Regra do Calor É Dado.** As cores heat-1 a heat-5 aparecem só onde representam acidentes (mapa, legenda, composição, amostras) e, no caso do vinho, erro. Nenhum botão, fundo ou destaque de interface usa a escala.

**A Regra do Azul Que Aponta.** O azul de seleção marca o que está escolhido ou focado agora. Se nada está ativo, não há azul na tela além dos links.

## Typography

**Display Font:** Barlow (com system-ui, sans-serif)
**Body Font:** Barlow (com system-ui, sans-serif)

**Character:** Uma família só, de desenho viário e condensação leve, carregada em 400, 600 e 700. O contraste vem de peso e tamanho; os números são sempre tabulares para alinhar contagens.

### Hierarchy
- **Display** (700, 2.5rem, 1): o total de acidentes no detalhe do ponto. Um número por tela.
- **Headline** (700, 1.75rem, 1.2): título de página (Metodologia).
- **Title** (700, 1.25rem, 1.2): títulos de seção, nome do ponto no detalhe, "Pontos críticos", título da gaveta.
- **Title pequeno** (700, 1rem, 1.2): títulos de aviso e legendas de grupo de filtro.
- **Número** (700, 1.125rem, tabular): número e total das faixas do ranking, posição no detalhe.
- **Body** (400, 1rem, 1.5): texto corrido; na Metodologia, parágrafos limitados a 68ch.
- **Label** (600, 1rem): botões, opções, nome do local na faixa, links de navegação.
- **Nota** (400, 0.875rem): rótulos de campo, resumos, dicas, ressalvas, legenda do mapa (600 no título da legenda).
- **Placa do mapa** (700, 0.8125rem, 1, tabular): número dentro da placa de 28 px.

### Named Rules
**A Regra da Caixa Normal.** Nenhum rótulo, título ou botão em caixa-alta, e nenhuma fonte monoespaçada. Hierarquia por peso, não por caixa.

**A Regra do Número Tabular.** Toda quantidade, data ou posição usa `font-variant-numeric: tabular-nums` e, em listas, fica alinhada à direita. Texto fica sempre alinhado à esquerda.

## Layout

Mobile first. No celular, o cabeçalho sticky de 56 px fica sobre o mapa em tela cheia (`100dvh` menos o cabeçalho), e o ranking vive numa folha inferior fixa com três alturas: baixa (174 px, mostra a primeira faixa inteira), média (52dvh) e alta (tela menos cabeçalho menos 16 px). Os filtros abrem numa gaveta inferior sobre um véu de tinta a 55%, com rodapé fixo que respeita a área segura.

A partir de 900 px, o painel lateral vira coluna fixa de 360 px à esquerda (filtros no topo, separados do ranking por filete de 2 px em tinta), e o mapa ocupa o restante. A página de Metodologia é uma coluna de leitura de até 72ch, com 24/16 px de respiro no celular e 40/32 px no desktop.

Ritmo de espaçamento em passos de 4 px: 4, 8, 12, 16, 20, 24, 32. O recuo horizontal padrão de painel é 16 px; o espaço entre itens irmãos é 8 ou 12 px; grupos de filtro distam 20 px; seções da Metodologia, 32 px. Elementos flutuantes sobre o mapa (legenda, zoom) ficam a 12 px da borda.

**A Regra dos 44.** Todo controle tocável (botão, opção, campo, link de navegação, alça da folha, placa do mapa) tem área mínima de 44 px, mesmo quando o desenho visível é menor (a placa do mapa mede 28 px dentro de um alvo de 44).

## Elevation & Depth

O sistema é plano. Não há `box-shadow` em nenhuma superfície; o controle de zoom do Leaflet tem a sombra padrão removida. Profundidade se expressa por três meios: blocos de tinta sólida (cabeçalho, botão primário, placas), filetes (1 px em slate-line entre conteúdos, 2 px em tinta na borda superior da folha e da gaveta e entre regiões do painel) e o mapa-base rebaixado (tiles em escala de cinza, contraste 0,82, brilho 1,08, opacidade 0,85) para que calor e placas fiquem à frente. A gaveta de filtros se separa por um véu de tinta a 55%, não por sombra.

**A Regra Sem Sombra.** Nenhuma superfície ganha sombra, nem em hover. Para separar, use um filete; para destacar, use tinta sólida.

**A Regra do Filete Honesto.** Bordas só onde há separação real de conteúdo: entre faixas, linhas de lista, regiões do painel. Nunca uma borda envolvendo um grupo só para "encaixotar" (sem cartões).

## Shapes

Cantos de chapa estampada: 4 px (placa) em botões, campos, opções, legenda, controle de zoom, números das faixas e placas do mapa. Elementos miúdos (contador de filtros, amostras de cor, alça da folha, faixa da legenda) usam 2 px ou menos. Folha inferior, gaveta e painel lateral não têm canto: são retângulos colados à borda da tela. Ícones são SVG de traço 2 px com ponta quadrada e junção em quina (`stroke-linecap: square`, `stroke-linejoin: miter`), como pictogramas de placa, em 16 a 20 px.

## Components

### Buttons
Diretos e sólidos, como placa de orientação.
- **Shape:** canto de placa (4 px), altura mínima de 44 px, borda de 2 px em tinta.
- **Primary:** fundo tinta, texto papel, 600, 0 16 px de recuo; ícone opcional a 8 px do texto ("Filtrar", "Ver resultados", "Tentar de novo").
- **Hover / Focus:** hover clareia a tinta (ink-hover); foco é o anel global de 3 px em azul de seleção, a 2 px de distância.
- **Secondary:** fundo transparente, texto e borda em tinta; hover em slate-soft ("Limpar filtros").
- **Disabled:** borda slate-line, texto cinza, fundo transparente.
- **Ícone:** 44 × 44 px, sem borda, fundo transparente, hover em slate-soft (fechar detalhe, fechar gaveta).
- **Textos:** verbo no infinitivo ("Ver no mapa", "Limpar filtros").

### Chips (opções de filtro)
- **Style:** caixa de 44 px de altura, borda de 1 px em cinza, canto de placa, texto 600, recuo de 12 px; dias da semana em grade de 7 colunas iguais com 4 px de vão, tipos de via em linha com 8 px.
- **State:** hover em slate-soft; marcada vira bloco de tinta com texto papel; o foco do input escondido desenha o anel azul na caixa.
- **Contador:** o botão de filtros mostra os filtros ativos num quadrado papel de 24 px, canto 2 px, texto tinta 700 tabular.

### Cards / Containers
Não há cartões. Os contêineres são regiões coladas à tela (painel lateral, folha inferior, gaveta) com fundo papel e filetes. A legenda do mapa é a única caixa flutuante: fundo papel, borda de 1 px em slate-line, canto de placa, 168 px de largura, 8/10 px de recuo, sem sombra.

### Inputs / Fields
- **Style:** fundo papel, borda de 1 px em cinza, canto de placa, 44 px de altura, 0 10 px de recuo, texto tinta 1rem tabular; rótulo acima em nota cinza, 4 px de vão.
- **Focus:** anel global de 3 px em azul de seleção.
- **Error / Disabled:** desativado com texto cinza e borda slate-line; erro como frase em vinho (heat-5), 600, 0.875rem, abaixo do grupo, dizendo o que aconteceu e o que fazer.

### Navigation
- **Cabeçalho:** placa de rua, faixa de tinta de 56 px com texto papel. Marca à esquerda em 700 (1rem no celular, título curto; 1.125rem no desktop, título completo).
- **Links:** 600, 44 px de altura, 10 px de recuo (14 px no desktop); inativos em papel a 82%; a página atual leva um filete inferior de 3 px em papel. No celular o link "Mapa" some porque a marca já leva ao mapa.
- **Idioma:** seletor transparente com borda de 1 px em papel a 45%, canto de placa, texto papel 600.
- **Foco:** dentro do cabeçalho o anel de foco é papel, não azul.

### Faixas do ranking (componente-assinatura)
O ranking em faixas numeradas de 1 a N é o elemento marcante. Cada faixa é um botão de largura total, mínimo de 56 px, em grade de três colunas (40 px, 1fr, auto) com 12 px de vão e 8/16 px de recuo: um bloco de tinta de 40 px com a posição em papel (700, 1.125rem, tabular), o nome do local em 600, e o total alinhado à direita em 700, 1.125rem, tabular. Faixas são separadas por filete de 1 px em slate-line. Hover em slate-soft; a faixa ativa ganha fundo blue-soft e o número vira azul de seleção. Escolher uma faixa leva o mapa ao ponto e abre o detalhe.

### Placas do mapa
Os pontos críticos de maior posição aparecem como placas numeradas de 28 px: fundo tinta, contorno de 2 px em papel, número em papel 700 0.8125rem tabular, dentro de alvo de 44 px. A placa ativa vira azul de seleção com contorno externo de 2 px em tinta. Placas não se sobrepõem (as de posição pior ficam de fora até o zoom abrir espaço). Com zoom de perto, os demais pontos aparecem como círculos de 5 px em tinta com contorno papel de 1,5 px.

### Detalhe do ponto
Abre no lugar do ranking. Topo na mesma grade da faixa (posição em bloco azul, nome em título, botão fechar); total em display com a explicação em cinza na mesma linha de base; barra de composição de 12 px com segmentos de calor separados por 2 px; lista de definição com filetes, amostras de 14 px e valores à direita em 600 tabular.

### Estados
- **Carregando:** blocos de 40 px em slate-soft, canto de placa, alternando largura total e 86%. Sem animação.
- **Vazio:** título, frase em cinza e botão para limpar filtros.
- **Erro de carga:** título em vinho, frase em cinza com a data da última atualização da base, botão para tentar de novo.

### Movimento
Uma única transição: a altura da folha do ranking no celular, 220 ms em `cubic-bezier(0.16, 1, 0.3, 1)`, desligada sob movimento reduzido e no desktop. O voo do mapa até o ponto (0,6 s) é comportamento do mapa e também vira salto direto sob movimento reduzido.

## Do's and Don'ts

### Do:
- **Do** usar tinta sólida (ink) com texto papel para tudo que é placa: cabeçalho, botão primário, opção marcada, número de faixa, marcador do mapa.
- **Do** reservar o azul de seleção para estado ativo, foco (anel de 3 px a 2 px de distância) e links.
- **Do** usar a escala de calor só para dados de acidentes, na ordem heat-1 (menos) a heat-5 (mais), e o vinho para erro.
- **Do** separar conteúdo com filete de 1 px em slate-line e regiões com filete de 2 px em tinta.
- **Do** dar 44 px de área de toque a todo controle e usar canto de 4 px em controles e placas.
- **Do** usar números tabulares alinhados à direita para toda quantidade, e texto alinhado à esquerda.
- **Do** manter o mapa-base em escala de cinza rebaixada para que calor e placas fiquem à frente.

### Don't:
- **Don't** usar sombras, cartões ou gradientes de interface. A faixa da legenda e a camada de calor são gradientes de dado, não de interface, e são permitidas.
- **Don't** escrever rótulos, títulos ou botões em caixa-alta, nem usar fonte monoespaçada.
- **Don't** introduzir uma segunda família tipográfica ou pesos fora de 400, 600 e 700.
- **Don't** usar azul-petróleo nem qualquer cor nova fora da paleta de cinco grupos.
- **Don't** adicionar transições além da folha do ranking; nenhum hover animado, nenhum carregamento pulsante.
- **Don't** envolver grupos com bordas só para encaixotar; borda só onde há separação real de conteúdo.
