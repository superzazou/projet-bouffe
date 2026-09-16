# Phase 2: Mobile Day View + Swipe Navigation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-16
**Phase:** 2-Mobile Day View + Swipe Navigation
**Areas discussed:** Animation du swipe, Mini-barre semaine, Modale d'ajout de recette, En-tête mobile

---

## Animation du Swipe

| Option | Description | Selected |
|--------|-------------|----------|
| Swap instantané | Le contenu change immédiatement au relâcher. Plus simple, aucun risque de jank. | ✓ |
| Slide animé | Glissement CSS pendant le swipe. Feeling plus natif mais plus complexe. | |
| Vous décidez | Laisser au planner. | |

**User's choice:** Swap instantané

---

| Option | Description | Selected |
|--------|-------------|----------|
| Au relâcher, si ≥ seuil horizontal | Seuil ~30–40px. Annulation sous le seuil. Pattern standard iOS/Android. | ✓ |
| Au relâcher, toujours | Toute direction horizontale déclenche le changement. | |

**User's choice:** Au relâcher, si ≥ seuil horizontal

---

| Option | Description | Selected |
|--------|-------------|----------|
| Axe déterminé au premier mouvement | Δx > Δy → verrouille swipe + preventDefault. Sinon scroll natif. | ✓ |
| Toujours prévenir le scroll | preventDefault systématique — bloque le scroll vertical. | |

**User's choice:** Axe déterminé au premier mouvement

---

## Mini-Barre Semaine

| Option | Description | Selected |
|--------|-------------|----------|
| Abréviation + numéro de jour | "Lun" + "16". Cohérent avec Google Calendar. | |
| Abréviation seule | "Lun", "Mar"… Plus compact. | ✓ |
| Numéro seul | "16", "17"… Maximum compact. | |

**User's choice:** Abréviation seule

---

| Option | Description | Selected |
|--------|-------------|----------|
| Badge cercle, couleurs différentes | Aujourd'hui : stone-900. Sélectionné non-aujourd'hui : stone-200. | ✓ |
| Soulignement + badge | Trait pour sélectionné, badge pour aujourd'hui. | |
| Un seul état actif | Pas de distinction aujourd'hui/sélectionné. | |

**User's choice:** Badge cercle pour les deux, couleurs différentes

---

| Option | Description | Selected |
|--------|-------------|----------|
| Semaine courante fixe | 7 jours de la semaine en cours. Mise à jour automatique aux frontières. | ✓ |
| Défilable | Swipe de la mini-barre pour autres semaines. Conflits gestuels potentiels. | |

**User's choice:** Semaine courante fixe

---

## Modale d'Ajout de Recette

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet | Remonte du bas. Feeling natif iOS/Android. | ✓ |
| Dialog centré | Modal classique au centre. Cohérent avec le web standard. | |

**User's choice:** Bottom sheet

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tap fond + bouton Annuler | Tap fond sombre ferme. Bouton "Annuler"/× visible. | ✓ |
| Swipe vers le bas uniquement | Geste seul, pas de bouton. Moins accessible. | |
| Tap fond + swipe bas | Les deux gestes. Risque de confusion avec swipe de navigation. | |

**User's choice:** Tap fond + bouton Annuler

---

| Option | Description | Selected |
|--------|-------------|----------|
| RecipeCombobox existant | Réutilisé tel quel dans le sheet. Pas de nouvelle logique de recherche. | ✓ |
| Input de recherche custom | Nouveau composant dédié mobile. Duplication de la logique de filtrage. | |

**User's choice:** RecipeCombobox existant

---

## En-Tête Mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, label complet | "Mercredi 16 septembre" au-dessus des slots. | ✓ |
| Non, mini-barre suffit | Pas de heading de date séparé. Plus compact. | |

**User's choice:** Label complet du jour courant

---

| Option | Description | Selected |
|--------|-------------|----------|
| Swipe seul | Pas de flèches sur mobile. Interface épurée. | ✓ |
| Flèches + swipe | Flèches de navigation semaine sur mobile aussi. Redondant. | |

**User's choice:** Swipe seul

---

| Option | Description | Selected |
|--------|-------------|----------|
| Visible en bas de la vue jour | Sous les slots Midi/Soir. Toujours accessible. | ✓ |
| Dans l'en-tête mobile | À côté de la mini-barre. Écrase l'espace. | |
| Masqué derrière un menu | Via icône ⋯. Trop enterré. | |

**User's choice:** Visible en bas de la vue jour

---

## Claude's Discretion

Aucun — l'utilisateur a pris des décisions sur toutes les options présentées.

## Deferred Ideas

- Animation slide du swipe — décidé : swap instantané. Pourrait être revisité en v2.
- v2 Polish (PLH-01 bouton Aujourd'hui, PLH-02 opacité jours passés, PLH-03 dots indicateurs) — roadmap v2.
