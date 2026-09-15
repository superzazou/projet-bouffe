# Roadmap: Projet Bouffe — Refonte Planning des Repas

## Overview

Remplacement de la vue planning verticale par une expérience calquée sur Google Calendar : grille semaine horizontale sur desktop, vue jour unique avec navigation tactile sur mobile. La correction du bug timezone est le premier travail — toute l'interface de dates en dépend. Phase 1 livre desktop complet et fonctionnel ; Phase 2 ajoute la couche mobile par-dessus les mêmes données et Server Actions.

## Phases

**Phase Numbering:**
- Integer phases (1, 2): Planned milestone work
- Decimal phases (1.1, 1.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation + Desktop Week Grid** - Corriger le bug timezone et livrer la vue semaine horizontale desktop complète
- [ ] **Phase 2: Mobile Day View + Swipe Navigation** - Ajouter la vue mobile jour unique avec mini-barre et navigation tactile

## Phase Details

### Phase 1: Foundation + Desktop Week Grid
**Goal**: Users can view and manage the full week meal plan from a desktop browser with correct date handling across all timezones
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, DSK-01, DSK-02, DSK-03, DSK-04, SHR-01, SHR-02 (desktop), SHR-03 (desktop), SHR-04
**Success Criteria** (what must be TRUE):
  1. User sees 7 day columns side by side with today's column visually highlighted and distinct from other days
  2. User can navigate to the previous or next week using arrow controls; today is the starting point on page load
  3. Each day column shows the abbreviated day name and date number; dates are correct regardless of the user's UTC offset
  4. User can add a recipe to any Midi or Soir slot via an inline combobox and immediately see it appear
  5. User can remove a recipe from any slot; the "Creer une liste de courses" button remains accessible and functional
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Fix timezone bug in getMondayOf/toDateStr and derive todayStr client-side (FND-01)
- [ ] 01-02-PLAN.md — Replace vertical layout with 7-column horizontal grid, add today badge, merge nav row (DSK-01–04, SHR-01–04)
**UI hint**: yes

### Phase 2: Mobile Day View + Swipe Navigation
**Goal**: Users on mobile can view and manage their daily meals with touch-native day navigation
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, SHR-02 (mobile), SHR-03 (mobile)
**Success Criteria** (what must be TRUE):
  1. User on mobile sees one day at a time (today by default) with Midi and Soir slots displayed
  2. User can tap any day pill in the mini week strip to jump directly to that day
  3. User can swipe left to advance to the next day and swipe right to go back; crossing week boundaries (Sunday to Monday, Monday to Sunday) works automatically
  4. User can tap the "+" button on any slot to open a recipe search modal and add a recipe
  5. User can remove a recipe from any slot on mobile
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Desktop Week Grid | 0/? | Not started | - |
| 2. Mobile Day View + Swipe Navigation | 0/? | Not started | - |
