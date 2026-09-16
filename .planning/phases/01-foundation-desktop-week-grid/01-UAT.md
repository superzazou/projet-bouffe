---
status: testing
phase: 01-foundation-desktop-week-grid
source: [01-VERIFICATION.md]
started: 2026-09-16T00:00:00Z
updated: 2026-09-16T00:00:00Z
---

## Current Test

number: 1
name: 12-Step Smoke Test — layout, today badge, navigation, slots, shopping list
expected: |
  All 12 checklist items pass when running npm run dev and visiting /planning
awaiting: user response

## Tests

### 1. 12-Step Smoke Test

Run `npm run dev`, open http://localhost:3000/planning, verify:

1. **Layout (DSK-01):** 7 day columns side by side — no vertical stacking
2. **Today badge (DSK-02):** Today's column header has a filled dark circle; others don't
3. **Today label (D-02):** Today's day abbreviation is bold/dark; others lighter
4. **Column body parity (D-03):** Today's meal slot area looks identical to other days
5. **Column headers (DSK-04):** Each column shows abbreviated day name above date number
6. **Navigation row (D-06):** "Créer une liste de courses" and week nav arrows are in the same horizontal row
7. **Navigation (DSK-03):** Prev/next week arrows work; "Cette semaine" label at current week
8. **Navigation limit (D-07):** Prev disabled after 4 clicks back; next disabled after 4 clicks forward
9. **Slots (SHR-01):** Each column shows Midi and Soir slots
10. **Add recipe (SHR-02):** Combobox adds recipe immediately without page reload
11. **Remove recipe (SHR-03):** "Retirer" removes recipe immediately without page reload
12. **Shopping list (SHR-04):** Button disabled with no meals; with meals opens modal, creates list, navigates to it

expected: All 12 pass
result: [pending]

### 2. Timezone Correctness

Confirm the highlighted "today" column matches the user's local system date in the browser (not UTC-shifted).

expected: Correct local date displayed
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
