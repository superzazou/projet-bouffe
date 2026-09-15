# Projet Bouffe — Refonte du planning des repas

## What This Is

Application web de gestion de repas familiaux permettant de planifier les repas de la semaine, gérer des recettes et générer des listes de courses. La prochaine étape est la refonte de la vue planning avec une expérience calquée sur Google Calendar : vue semaine horizontale sur desktop, vue jour unique avec navigation tactile sur mobile.

## Core Value

L'utilisateur peut voir et modifier son planning de la semaine en un coup d'œil, depuis n'importe quel appareil.

## Requirements

### Validated

- ✓ Affichage du planning semaine (Lun–Dim) avec repas Midi et Soir par jour — existing
- ✓ Ajout d'un plat à un slot via combobox de recherche de recettes — existing
- ✓ Suppression d'un plat d'un slot — existing
- ✓ Navigation prev/next entre semaines — existing
- ✓ Création d'une liste de courses depuis les recettes planifiées — existing
- ✓ Persistance dans Supabase (`meal_plans` table) — existing

### Active

- [ ] Desktop : vue semaine horizontale (7 colonnes), jour courant centré et mis en évidence
- [ ] Desktop : navigation semaine prev/next avec flèches, aujourd'hui comme point de départ
- [ ] Mobile : vue jour unique, jour courant affiché par défaut
- [ ] Mobile : mini-barre semaine en haut permettant de visualiser la semaine et de sélectionner un jour
- [ ] Mobile : swipe gauche/droite pour passer au jour suivant/précédent
- [ ] Mobile : ajout d'un plat via bouton + qui ouvre une modale de recherche de recette
- [ ] Les deux vues : conserver 2 slots par jour (Midi / Soir) avec ajout et suppression de recettes

### Out of Scope

- Affichage de photos/miniatures de recettes dans le planning — non demandé pour cette itération
- Drag & drop pour déplacer des repas — complexité non justifiée pour l'instant
- Vue mensuelle — hors scope de cette refonte

## Context

- Stack : Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Supabase
- Le composant existant `PlanningWeek.tsx` est une liste verticale de cards par jour, à remplacer
- Le composant `RecipeCombobox` est réutilisable pour l'ajout de recettes
- Les Server Actions `addMealPlan` et `deleteMealPlan` sont en place et ne changent pas
- La page charge les `meal_plans` et `recipes` en SSR et les passe au composant client

## Constraints

- **Tech stack** : React + Tailwind uniquement — pas de librairie de calendrier externe
- **Responsive** : breakpoint mobile/desktop via Tailwind (ex: `md:`)
- **Accessibilité tactile** : le swipe mobile doit fonctionner avec les événements touch natifs

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modale pour ajout sur mobile plutôt que combobox inline | La combobox inline est encombrante sur petit écran ; la modale offre plus d'espace pour la recherche | — Pending |
| Swipe + mini-barre sur mobile (les deux) | Permet navigation rapide (swipe) et vue d'ensemble (mini-barre) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-15 after initialization*
