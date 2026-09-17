---
status: testing
phase: 02-mobile-day-view-swipe-navigation
source: [02-VERIFICATION.md]
started: 2026-09-17T00:00:00Z
updated: 2026-09-17T00:00:00Z
---

## Current Test

number: 1
name: Full mobile UI sign-off (MOB-01 through SHR-03 + non-regression)
expected: |
  All 6 requirements verified on Chrome DevTools iPhone 12 Pro emulation
awaiting: user response

## Tests

### 1. MOB-01 — Single day view layout
expected: Mobile layout shows one day at a time below 768px; desktop grid visible at 1280px; today highlighted on page load (timezone spot-check in non-UTC)
result: [pending]

### 2. MOB-02 — Week strip pill navigation
expected: 7 pills at top; today has filled stone-900 circle; tap a pill → day heading + slot content update; selected non-today has stone-200 circle
result: [pending]

### 3. MOB-03 — Swipe navigation + week boundary
expected: Swipe left → next day; swipe right → previous day; Sunday swipe left → Monday of next week AND week strip updates; short drag (<30px) → no change; vertical drag → scrolls only
result: [pending]

### 4. MOB-04 — '+' button opens bottom sheet
expected: Tap '+' on a slot → bottom sheet opens with "Ajouter un repas"; onClick does not conflict with imperative swipe handler on parent div
result: [pending]

### 5. SHR-02 — RecipeCombobox in bottom sheet
expected: Select recipe → added to correct slot + sheet closes; backdrop closes; × closes; Fermer closes; RecipeCombobox dropdown not clipped by overflow-y-auto
result: [pending]

### 6. SHR-03 — Retirer on mobile
expected: Tap Retirer → recipe removed; button disabled while server responds (deletingKey guard)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
