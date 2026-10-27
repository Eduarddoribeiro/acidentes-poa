---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: []
---

# Painel principal (Operate)

Scope: painel principal + detalhe do ponto + metodologia, frontend/src. Visitor mode: Operate (visitante filtra e lê pontos críticos). Mobile first.

## Direction contract

seed: none (world pinned by docs/escopo.md §9.1 "Direção visual e de interface", accepted by the owner on 26/10/2026, escopo §15; a roll would override the owner decision)

THESIS: the city map reads like a road sign: direct, fast, nothing decorative. The data is the content.

WORLD: cold paper #EEF0EC, ink #1B2A33, blue-gray #5C6B73, selection blue #1F5A8A, heat ramp #FBE3A1→#7A0F1F. Barlow 400/600/700, tabular figures. No cards, shadows or gradients; rules only where content truly separates.

FIRST VIEWPORT: full-bleed map of Porto Alegre with heat layer and critical points already visible; on desktop a fixed 360 px panel left (filters on top, ranking below).

SIGNATURE: ranking as numbered sign bands 1..N (number, place name, count right-aligned); choosing a band flies the map and opens the point detail.

MOTION: one transition only, the ranking sheet opening on mobile (3 heights); off under reduced motion.

RISK: heavy heat colors overpower labels; keep map tiles muted and markers outlined in ink.
