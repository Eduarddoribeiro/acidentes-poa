# Escopo: Acidentes de Trânsito em Porto Alegre

**Status:** Aceito em 26/10/2026
**Cliente / dono:** projeto pessoal (portfólio)
**Responsável:** Eduardo Ribeiro

> Regra de mudança: depois do aceite, qualquer pedido novo entra na Fase 2 ou é avaliado com a skill nova-ideia-projeto antes de ser feito. Mudanças aceitas são registradas no Histórico.

## 1. Visão
- **Em uma frase:** Sistema web que mostra os pontos críticos de acidentes de trânsito em Porto Alegre, usado por cidadãos comuns em celular ou computador.
- **Problema hoje:** os dados de acidentes da prefeitura são públicos, mas estão em planilhas brutas, difíceis de ler e sem visão espacial.
- **Sucesso significa:** qualquer pessoa consegue ver, em um mapa, onde e quando ocorrem mais acidentes, e filtrar por horário, tipo de via e dia da semana.

## 2. Pessoas e permissões
| Perfil | Quem é | Pode ver | Pode fazer |
|---|---|---|---|
| Visitante | Cidadão comum (sem login) | Mapa, filtros, métricas, metodologia | Filtrar e explorar os dados |

Não há login nem perfil administrativo no MVP. A atualização dos dados é feita pelo próprio desenvolvedor, por linha de comando.

## 3. Fluxos principais
### 3.1 Consultar pontos críticos
1. Visitante abre a página inicial e vê o mapa de Porto Alegre com os pontos críticos.
2. Escolhe filtros (período, horário, dia da semana, tipo de via).
3. O mapa e o ranking dos locais mais críticos são atualizados.
4. Clica num ponto e vê a quantidade de acidentes, a composição (com feridos e com mortos, quando disponível) e o período.

**Termina quando:** o visitante identifica um local e vê os números que o sustentam.

### 3.2 Atualizar a base de dados
1. Desenvolvedor baixa a base mais recente da prefeitura (#DataPoa / EPTC).
2. Executa o pipeline de ingestão e limpeza.
3. O sistema registra quantos registros foram aceitos e quantos foram descartados, e por quê.

**Termina quando:** a base do banco reflete o arquivo mais recente e o relatório de carga foi gerado.

## 4. Regras de negócio
- **RN-01 – Ponto crítico por raio:** um local é considerado crítico quando tem N ou mais acidentes dentro de um raio de 100 m. *Exemplo:* 12 acidentes em 100 m de uma esquina entre janeiro e dezembro. **N = 20**, definido na análise exploratória (`notebooks/analise_exploratoria.ipynb`, 27/10/2026).
- **RN-02 – Dados sem coordenada:** registros sem latitude e longitude são descartados do mapa, e a quantidade é exibida na página de metodologia. *Exemplo:* 4% dos registros de 2024 sem coordenada aparecem como "registros fora do mapa: 4%".
- **RN-03 – Período padrão:** o painel mostra os últimos 5 anos da base por padrão. *Exemplo:* ao abrir a página em 2026, o período considerado é de 2021 a 2026.
- **RN-04 – Filtros combinam entre si (E):** a seleção de horário e dia da semana é aplicada em conjunto. *Exemplo:* "sábado, 22h às 2h" mostra só acidentes que ocorreram nesse recorte.
- **RN-05 – Tipo de via:** o filtro de tipo de via usa a classificação já existente na base. Se a base não tiver esse campo, o filtro não entra no MVP. *Exemplo:* avenida, rua, rodovia. *Decisão de 27/10/2026:* a base não tem campo próprio, mas todo logradouro começa pela sigla oficial da Prefeitura (AV, R, ESTR); essa sigla é a classificação usada (avenida, rua, estrada e outras).
- **RN-06 – Ressalva de uso:** a página deixa claro que os dados mostram ocorrências registradas, não culpa de condutores nem diagnóstico de causas. *Exemplo:* um ponto alto no mapa indica concentração de registros, não causa.

## 5. Entidades e ciclo de vida
| Entidade | Status possíveis | Pode repetir? | Cancelamento | Histórico |
|---|---|---|---|---|
| Acidente | importado → válido / descartado (sem coordenada ou inconsistente) | Não | Não se aplica | Mantém o registro original e o motivo do descarte |
| Ponto crítico | calculado a cada atualização da base | Não se aplica | Não se aplica | Recalculado; não guarda histórico no MVP |

## 6. MVP (primeira entrega)
| # | Funcionalidade | Critério de pronto |
|---|---|---|
| M1 | Ingestão da base da prefeitura | Script baixa ou lê o arquivo, valida colunas e grava no banco; gera relatório de carga com aceitos e descartados |
| M2 | Limpeza e padronização | Datas, horários e coordenadas tratados; registros inconsistentes descartados com motivo registrado; testes cobrindo os casos de descarte |
| M3 | Cálculo de pontos críticos por raio | Agrupamento por raio de 100 m com N definido na análise exploratória; testes com dados de exemplo |
| M4 | Mapa de calor interativo (Leaflet) | Mapa de Porto Alegre com camada de calor e pontos críticos clicáveis; funciona bem no celular |
| M5 | Filtros de período, horário, dia da semana e tipo de via | Filtros atualizam mapa e ranking; combinação E conforme RN-04 |
| M6 | Ranking dos locais mais críticos | Lista ordenada com quantidade, período e ação de "ver no mapa" |
| M7 | Página de metodologia | Explica fonte, período, critério de ponto crítico, quantidade descartada e ressalva de uso (RN-06) |
| M8 | Análise exploratória em notebook | Notebook com a distribuição por horário, dia e via, e a escolha justificada de N |
| M9 | README e deploy | README com instalação, metodologia e prints; sistema publicado em uma URL pública |
| M10 | Front em React com layout mobile primeiro | Painel lateral no desktop e gaveta inferior no celular; sem rolagem horizontal em 360 px; filtros e ranking funcionam em ambos |
| M11 | Interface segundo a direção visual (seção 9.1) | Paleta, tipografia e componentes da seção 9.1 aplicados; estados de carregando, vazio e erro tratados; Lighthouse de acessibilidade com nota 90 ou mais |
| M12 | Português e inglês | Todos os textos de interface e da metodologia nos dois idiomas; seletor no cabeçalho; datas e números formatados conforme o idioma |

## 7. Fase 2 (combinado para depois)
| # | Funcionalidade | Como o MVP já deixa a porta aberta |
|---|---|---|
| F1 | Modelo de classificação da gravidade (sem vítimas, com feridos, com mortos) | Tabela de acidentes já separa atributos e a gravidade como campo de origem |
| F2 | Dados de clima (chuva e temperatura, INMET) | Tabela de acidentes com data e coordenada, pronta para receber junção por data |
| F3 | Tendência temporal (mensal e anual) | Acidentes já guardam data completa, sem perda de precisão na limpeza |
| F4 | Complemento com dados da PRF para rodovias federais na região metropolitana | Ingestão em módulo separado, com o mesmo esquema de tabela |
| F5 | Geocodificação de registros sem coordenada | Registros descartados ficam salvos com motivo, então podem ser reprocessados |

## 8. Fora do escopo
- Login, cadastro e perfis de usuário (não há o que proteger no MVP).
- Aplicativo nativo para celular (a página é responsiva, mas não é app).
- Previsão de acidentes futuros (fica para depois, junto com o modelo da Fase 2).
- Atribuição de culpa a condutores ou análise de causas com base em registros individuais.
- Atualização automática agendada (a atualização é manual no MVP).

## 9. Telas
| Tela | Perfil | O que mostra / faz |
|---|---|---|
| Painel principal | Visitante | Mapa de calor, pontos críticos, filtros, ranking lateral |
| Detalhe do ponto | Visitante | Quantidade, composição e período de um local selecionado |
| Metodologia | Visitante | Fonte, período, critério, registros descartados e ressalva de uso |

### 9.1 Direção visual e de interface

**Assunto que guia o design:** sinalização viária. A interface se inspira na placa de trânsito: informação direta, leitura rápida e nada decorativo.

- **Paleta (5 cores):**
  - Papel frio `#EEF0EC` (fundo)
  - Tinta `#1B2A33` (texto principal)
  - Cinza-azulado `#5C6B73` (texto secundário e divisórias)
  - Azul de seleção `#1F5A8A` (ponto ativo e foco do teclado)
  - Escala do mapa de calor de `#FBE3A1` a `#7A0F1F`, sequencial e legível para daltônicos
- **Tipografia:** uma única família, Barlow, nos pesos 400, 600 e 700, com números tabulares para as quantidades. Sem caixa-alta em rótulos e sem fonte monoespaçada.
- **Layout no celular (primeiro):** mapa em tela cheia. O botão de filtros abre uma gaveta inferior e mostra quantos filtros estão ativos. O ranking aparece numa folha inferior com três alturas.
- **Layout no desktop:** painel fixo de 360 px à esquerda, com filtros no topo e ranking embaixo. O mapa ocupa o restante da tela.
- **Alinhamento:** texto sempre alinhado à esquerda. Números alinhados à direita nas listas.
- **Elemento marcante:** o ranking em faixas numeradas de 1 a N. A numeração faz sentido porque a lista é uma sequência real, de maior para menor número de acidentes. Cada faixa mostra o número, o nome do local e a quantidade.
- **Restante da interface:** sem cards, sem sombras e sem gradientes. Bordas só onde há separação real de conteúdo.
- **Movimento:** uma única transição, ao abrir a folha de ranking. Respeita a preferência de movimento reduzido do sistema.
- **Textos:** verbo no infinitivo nos botões ("Ver no mapa", "Limpar filtros"). Erros dizem o que aconteceu e o que fazer, sem pedido de desculpas.
- **Estados:** carregando com blocos de contraste suave; sem resultados com botão para limpar filtros; erro de carga com a data da última atualização da base.
- **Acessibilidade:** contraste AA em todos os textos, foco de teclado visível, rótulos em todos os campos, alvos de toque de 44 px e uma versão em tabela dos pontos críticos para leitor de tela.

**Revisão deste desenho:** o primeiro rascunho usava azul-petróleo, cards com sombra e rótulos em caixa-alta, que é o padrão genérico de painel de dados. Foi trocado por esta direção porque ela nasce do assunto (sinalização de rua) e não de um modelo pronto.

## 10. Modelo de dados (resumo)
- **acidente**: id, data, horário, dia da semana, latitude, longitude, tipo de via, bairro (se disponível), gravidade (se disponível), origem do arquivo, status (válido ou descartado), motivo do descarte.
- **carga**: id, arquivo de origem, data da carga, total lido, total aceito, total descartado.
- Ponto crítico é calculado em tempo de consulta, com cache por recorte de filtros (cerca de 1,6 s na primeira consulta).

## 11. Técnica
- **Stack:** Python com pandas para ingestão e análise; FastAPI como API em JSON; front em React (Vite) com react-leaflet para o mapa e leaflet.heat para o mapa de calor; react-i18next para português e inglês; testes com pytest no backend e Vitest com Testing Library no front; SQLite no MVP, com possibilidade de migrar para PostgreSQL. Motivo: stack moderna, comum em vagas júnior, com separação clara entre dados e interface.
- **Login:** não há.
- **Hospedagem e custo mensal estimado:** R$ 0 possível. Python, FastAPI, SQLite, Leaflet e os tiles do OpenStreetMap são gratuitos, e a base da prefeitura é pública. Hospedagem em plano gratuito, a confirmar no provedor escolhido no momento do deploy (planos gratuitos costumam ter limitações, como suspensão por inatividade). Único custo opcional: domínio próprio.
- **Domínio / backup / offline:** domínio opcional; backup do arquivo SQLite a cada carga; não exige funcionamento offline.
- **Dados pessoais (LGPD):** a base da prefeitura não deve conter identificação de pessoas. Confirmar na análise inicial que não há nome, CPF ou placa. Se houver, esses campos são removidos na ingestão.

## 12. Riscos
- **Qualidade da base:** registros incompletos, coordenadas erradas ou campos mudando de nome entre anos. Mitigação: validação de colunas e relatório de carga.
- **Interpretação equivocada:** o mapa pode ser lido como "lugar perigoso" de forma absoluta, sem considerar volume de trânsito. Mitigação: RN-06 e página de metodologia com a ressalva.
- **Formato do arquivo:** o formato e a frequência de atualização da base ainda não foram confirmados. Mitigação: primeira tarefa é baixar e avaliar a base (M1).
- **Escopo crescer:** tentação de incluir clima e modelo de gravidade já no MVP. Mitigação: estão na Fase 2.

## 13. Suposições a confirmar
- [CONFIRMADO 27/10/2026] A base tem latitude e longitude para 91,8% dos registros (91% a 96% de 2021 a 2025; 81% em 2026).
- [CONFIRMADO 27/10/2026] Gravidade existe (campo UPS: sem vítimas, com feridos, com mortos). Tipo de via não existe como campo; vem da sigla do logradouro (RN-05).
- [CONFIRMADO 27/10/2026] A base cobre de 01/01/2021 a 30/09/2026.
- [CONFIRMADO 27/10/2026] N = 20, escolhido pela distribuição dos dados (seção 6 do notebook).
- [CONFIRMADO 27/10/2026] A base não traz nome, CPF nem placa (LGPD).

## 14. Perguntas para o cliente
Não há cliente externo neste projeto. Pontos que dependem de decisão do próprio desenvolvedor estão na seção 13.

## 15. Histórico de mudanças
| Data | Mudança | Origem | Decisão |
|---|---|---|---|
| 25/10/2026 | Escopo inicial | Planejamento | Rascunho |
| 26/10/2026 | Escopo aceito; custo confirmado como gratuito (domínio opcional) | Eduardo | Aceito |
| 27/10/2026 | N = 20 definido na análise exploratória (RN-01) | Análise da base | Proposto; Eduardo confirma |
| 27/10/2026 | Tipo de via pela sigla do logradouro, pois a base não tem o campo (RN-05) | Análise da base | Aceito por Eduardo |
| 27/10/2026 | Registros com data posterior à extração são descartados (motivo próprio) | Análise da base | Proposto; Eduardo confirma |
