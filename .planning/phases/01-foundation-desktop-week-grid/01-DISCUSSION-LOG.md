# Phase 1: Foundation + Desktop Week Grid - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-15
**Phase:** 1-Foundation + Desktop Week Grid
**Areas discussed:** Aujourd'hui highlight, Navigation controls

---

## Aujourd'hui highlight

### Question 1 — Visual treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Badge sur le numéro de date | Cercle stone-900 derrière le chiffre, texte blanc. Style Google Calendar. | ✓ |
| Header tinté + badge | Fond léger sur la cellule header + badge sur la date. Plus visible mais plus lourd. | |
| Bordure + texte plus gras | Approche actuelle (bordure plus foncée + label en gras). | |

**User's choice:** Badge sur le numéro de date
**Notes:** Chosen for its clean, minimal Google Calendar feel without disturbing column layout.

### Question 2 — Badge color

| Option | Description | Selected |
|--------|-------------|----------|
| stone-900 (noir) | Cohérent avec la palette existante (boutons, bordures). | ✓ |
| Teinte accent chaude | Orange, amber, ou red — expressif mais nouvelle couleur. | |
| Vous décidez | Laisser le planificateur choisir. | |

**User's choice:** stone-900
**Notes:** Keeps the design system consistent — no new color tokens.

### Question 3 — Day label treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, label en stone-900 gras | Jours normaux en stone-400, aujourd'hui en stone-900 + font-semibold. | ✓ |
| Non, badge seul suffit | Label identique pour tous les jours. | |

**User's choice:** Oui — label stone-900 font-semibold for today, stone-400 for others

### Question 4 — Column body treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Non, header seul | Corps identique aux autres colonnes. Header distinction alone suffices. | ✓ |
| Léger fond sur la colonne entière | Fond très léger sur toute la hauteur. | |

**User's choice:** Header seul — no additional body treatment.

---

## Navigation controls

### Question 1 — Navigation bar placement

| Option | Description | Selected |
|--------|-------------|----------|
| Barre dédiée au-dessus de la grille | Ligne indépendante: ← \| label \| →. Style actuel préservé. | ✓ |
| Intégrée dans la rangée header des colonnes | Flèches dans pseudo-colonnes flanquant la grille. Plus compact, plus complexe. | |
| Vous décidez | Laisser le planificateur choisir. | |

**User's choice:** Barre dédiée — same structure as current, above the grid.

### Question 2 — Week label format

| Option | Description | Selected |
|--------|-------------|----------|
| Garder le format actuel | "Cette semaine" quand weekOffset=0, range sinon. | ✓ |
| Toujours afficher les dates | Format cohérent: "15–21 sep" pour toutes les semaines. | |
| Afficher le mois + année | "Septembre 2026" — moins précis mais plus de contexte annuel. | |

**User's choice:** Keep existing format — formatWeekLabel() unchanged.

### Question 3 — Shopping list button placement

| Option | Description | Selected |
|--------|-------------|----------|
| Même barre, à gauche (actuel) | Bouton dans le même flex row que la navigation. | ✓ |
| Barre séparée — bouton au-dessus de la nav | Ligne dédiée au bouton d'action. | |
| Vous décidez | Laisser le planificateur choisir selon le layout. | |

**User's choice:** Same bar, left side — current layout preserved.

### Question 4 — Navigation range

| Option | Description | Selected |
|--------|-------------|----------|
| Garder ±4 semaines | Plage suffisante. canGoPrev/canGoNext logic unchanged. | ✓ |
| Élargir à ±8 semaines | Plus de flexibilité pour planification longue. | |
| Retirer la limite | Navigation libre. | |

**User's choice:** Keep ±4 weeks.

---

## Claude's Discretion

- Column overflow strategy (horizontal scroll vs. squeeze) — left to planner.
- Exact column padding, spacing, slot heights — left to planner (stay consistent with stone palette).

## Deferred Ideas

- Grid overflow/scroll behavior — not discussed, deferred to planner.
- v2 polish items (PLH-01, PLH-02, PLH-03) — already in roadmap v2.
