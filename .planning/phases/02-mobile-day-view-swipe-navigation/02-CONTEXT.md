# Phase 2: Mobile Day View + Swipe Navigation - Context

**Gathered:** 2026-09-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Ajouter la couche mobile à `PlanningWeek.tsx` — vue jour unique avec mini-barre semaine et navigation swipe gauche/droite. Phase 1 a livré la grille desktop complète. Cette phase ajoute le comportement mobile par-dessus les mêmes données, Server Actions et logique de dates — rien ne change côté données.

**In scope:**
- MOB-01: Vue jour unique sur mobile, aujourd'hui par défaut
- MOB-02: Mini-barre semaine (7 pills, abréviation du jour, tap pour sélectionner)
- MOB-03: Swipe gauche/droite pour naviguer entre les jours ; passage automatique de semaine aux limites
- MOB-04: Bouton + sur chaque slot ouvre un bottom sheet de recherche de recette
- SHR-02 (mobile): Ajout de recette via bottom sheet
- SHR-03 (mobile): Suppression de recette depuis la vue mobile

**Out of scope:**
- Modifications de la vue desktop (Phase 1 terminée)
- Animation slide du swipe — swap instantané seulement
- Navigation semaine explicite par flèches sur mobile
- v2 polish (PLH-01 Aujourd'hui, PLH-02 jours passés en opacité, PLH-03 dots indicateurs)

</domain>

<decisions>
## Implementation Decisions

### Swipe Gesture
- **D-01:** Swap instantané — pas d'animation slide. Le contenu du jour change immédiatement au relâcher du doigt, sans transition CSS. — **Reversibility:** reversible
- **D-02:** Le swipe se déclenche au relâcher si le déplacement horizontal est ≥ seuil (~30–40 px). En dessous du seuil, l'action est annulée (pas de changement de jour). — **Reversibility:** reversible
- **D-03:** L'axe de geste est déterminé au premier mouvement : si Δx > Δy, on verrouille sur swipe et on appelle `preventDefault` pour bloquer le scroll vertical. Sinon le scroll natif passe librement. Attachment impératif `useEffect` avec `{ passive: false }` (requis pour `preventDefault` sur les event listeners touch). — **Reversibility:** reversible

### Mini-Barre Semaine
- **D-04:** Chaque pill affiche l'abréviation du jour seule ("Lun", "Mar"…) — pas de numéro de date dans la pill. — **Reversibility:** reversible
- **D-05:** Deux états visuels distincts dans les pills :
  - Aujourd'hui (sélectionné ou non) : badge cercle `bg-stone-900 text-white` — même badge que Phase 1 desktop
  - Sélectionné (non aujourd'hui) : badge cercle `bg-stone-200 text-stone-900`
  - Non sélectionné, non aujourd'hui : texte normal sans badge — **Reversibility:** reversible
- **D-06:** La mini-barre affiche toujours les 7 jours de la semaine courante (fixe). Elle se met à jour automatiquement quand un swipe traverse une frontière de semaine (dim→lun ou lun→dim). — **Reversibility:** reversible

### Modale d'Ajout de Recette
- **D-07:** Bottom sheet — panel qui remonte depuis le bas de l'écran. Feeling natif iOS/Android. — **Reversibility:** reversible
- **D-08:** Fermeture du bottom sheet par tap sur le fond sombre OU par bouton "Fermer" / "×" visible dans le sheet. Pas de geste swipe-bas pour fermer (évite conflit avec swipe de navigation). *(label mis à jour : "Annuler" → "Fermer" après revue UI-SPEC 2026-09-16)* — **Reversibility:** reversible
- **D-09:** Contenu du bottom sheet = `RecipeCombobox` existant réutilisé tel quel. Pas de nouveau composant de recherche. — **Reversibility:** reversible

### En-Tête Mobile
- **D-10:** Label complet du jour courant affiché au-dessus des slots (ex : "Mercredi 16 septembre"). Donne le contexte date sans avoir à lire la mini-barre. — **Reversibility:** reversible
- **D-11:** Swipe seul pour la navigation de semaine sur mobile. Pas de flèches prev/next semaine affichées sur mobile. — **Reversibility:** reversible
- **D-12:** Bouton "Créer une liste de courses" visible en bas de la vue jour (sous les slots Midi/Soir), pas dans l'en-tête. — **Reversibility:** reversible

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composant principal à étendre
- `src/app/(app)/planning/PlanningWeek.tsx` — Composant client à modifier : contient tout l'état (`weekOffset`, `mealPlans`, `selectedDay`), les utilitaires de date (`getMondayOf`, `toDateStr`, `addDays`, `formatWeekLabel`), le rendu desktop, et la modale liste de courses. La couche mobile s'ajoute ici.

### Composant réutilisable (modale)
- `src/components/RecipeCombobox.tsx` — Combobox de recherche de recettes à réutiliser dans le bottom sheet mobile. Interface : `recipes`, `onAdd`, `disabled`, `excludeIds`.

### Server Actions (inchangés)
- `src/app/(app)/planning/actions.ts` — `addMealPlan` / `deleteMealPlan` — pas de modification.
- `src/app/(app)/shopping-lists/actions.ts` — `createShoppingListFromPlanning` — pas de modification.

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — Requirements Phase 2 : MOB-01–04, SHR-02 (mobile), SHR-03 (mobile)
- `.planning/ROADMAP.md` — Success criteria Phase 2 (5 items)
- `.planning/PROJECT.md` — Contraintes : React + Tailwind uniquement, breakpoints `md:`, touch events natifs

### Phase 1 context (référence pour patterns établis)
- `.planning/phases/01-foundation-desktop-week-grid/01-CONTEXT.md` — Décisions desktop déjà implémentées (badge today, navigation, palette stone-*)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PlanningWeek.tsx` — État `weekOffset` existant pilote déjà la semaine affichée. Il faut ajouter `selectedDay` (date string) pour la vue mobile. Les deux états coexistent.
- `RecipeCombobox` — Drop-in dans le bottom sheet mobile. Même interface que desktop.
- `addDays(date, n)` — Correct et stable, à réutiliser pour calculer le jour précédent/suivant.
- `getMondayOf(dateStr)` — Corrigé en Phase 1 (parse local, pas UTC). Fondation saine pour la mini-barre.
- Shopping list modal — Déjà dans `PlanningWeek.tsx`, à conserver sans modification.

### Established Patterns
- Palette `stone-*` uniquement — aucun nouveau token couleur.
- `"use client"` directive sur tous les composants interactifs.
- `useState` local — pas de state global.
- Optimistic UI (`setMealPlans` immédiat sur add/remove sans attendre revalidation) — à conserver sur mobile.
- Badge cercle `bg-stone-900 text-white` pour aujourd'hui — réutiliser sur la mini-barre (D-05).

### Integration Points
- Breakpoint Tailwind `md:` sépare mobile et desktop dans le même composant — pattern à suivre pour cacher/afficher les deux layouts.
- Props inchangées : `initialMealPlans`, `recipes`, `today` — la page RSC ne change pas.
- Touch event listeners : `useEffect` impératif avec `{ passive: false }` requis pour `preventDefault` sur `touchmove` (si Δx > Δy).

</code_context>

<specifics>
## Specific Ideas

- Mini-barre : badge cercle stone-900 pour aujourd'hui = même traitement que la phase desktop (cohérence visuelle entre les deux breakpoints).
- Bottom sheet : fermeture par tap fond uniquement (pas swipe-bas) pour éviter le conflit avec la navigation jour par swipe.
- Label de date en heading : "Mercredi 16 septembre" — format localisé `fr-FR`, même style que les autres headings de l'app.

</specifics>

<deferred>
## Deferred Ideas

- v2 Polish : PLH-01 (bouton Aujourd'hui), PLH-02 (jours passés en opacité réduite), PLH-03 (point indicateur repas planifiés) — roadmap v2, post-Phase 2.
- Animation slide du swipe — décision prise : swap instantané. Pourrait être revisité en v2 si le feeling est trop abrupt.

</deferred>

---

*Phase: 2-Mobile Day View + Swipe Navigation*
*Context gathered: 2026-09-16*
