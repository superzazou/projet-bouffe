# Requirements: Projet Bouffe — Refonte Planning des Repas

**Defined:** 2026-09-15
**Core Value:** L'utilisateur peut voir et modifier son planning de la semaine en un coup d'œil, depuis n'importe quel appareil.

## v1 Requirements

### Foundation (technique)

- [x] **FND-01**: La logique de parsing des dates ne produit pas de décalage de jour selon le fuseau horaire de l'utilisateur (corriger `getMondayOf`/`toDateStr` — bug UTC existant)

### Desktop Layout

- [x] **DSK-01**: L'utilisateur voit les 7 jours de la semaine en colonnes horizontales côte à côte (remplace la liste verticale)
- [x] **DSK-02**: La colonne du jour courant est visuellement distinguée des autres jours
- [x] **DSK-03**: L'utilisateur peut naviguer vers la semaine précédente ou suivante via des flèches, aujourd'hui étant le point de départ
- [x] **DSK-04**: Chaque colonne affiche le jour abrégé et la date

### Mobile Layout

- [ ] **MOB-01**: L'utilisateur voit un seul jour à la fois sur mobile, aujourd'hui par défaut
- [ ] **MOB-02**: Une mini-barre en haut affiche les 7 jours de la semaine en pills ; l'utilisateur peut sélectionner un jour par tap
- [ ] **MOB-03**: L'utilisateur peut swiper gauche/droite pour naviguer entre les jours ; le passage d'une semaine à l'autre est automatique aux limites (dim → lun, lun → dim)
- [ ] **MOB-04**: L'utilisateur peut ajouter une recette à un slot via un bouton + qui ouvre une modale de recherche

### Shared — Fonctionnalités préservées

- [x] **SHR-01**: Chaque jour affiche deux slots (Midi / Soir) sur les deux vues
- [x] **SHR-02**: L'utilisateur peut ajouter une recette à n'importe quel slot (combobox inline sur desktop, modale sur mobile)
- [x] **SHR-03**: L'utilisateur peut retirer une recette d'un slot sur les deux vues
- [x] **SHR-04**: Le bouton "Créer une liste de courses" reste accessible et fonctionnel

## v2 Requirements

### Polish

- **PLH-01**: Bouton "Aujourd'hui" pour réinitialiser la navigation vers le jour courant
- **PLH-02**: Colonnes/jours antérieurs à aujourd'hui affichés en opacité réduite
- **PLH-03**: Point indicateur sous chaque pill de la mini-barre si des repas sont planifiés ce jour

## Out of Scope

| Feature | Reason |
|---------|--------|
| Drag & drop pour déplacer des repas | Complexité élevée, conflits gestuels avec le swipe mobile |
| Miniatures/photos de recettes dans le planning | Infrastructure image hors scope |
| Vue mensuelle | Paradigme UX différent, granularité semaine couvre les besoins |
| Scrolling infini multi-semaine sans limite | Conflits avec la sémantique du swipe mobile |
| Bordure pointillée sur slots vides | P2 polish, dépend de la stabilité du core |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Complete |
| DSK-01 | Phase 1 | Complete |
| DSK-02 | Phase 1 | Complete |
| DSK-03 | Phase 1 | Complete |
| DSK-04 | Phase 1 | Complete |
| SHR-01 | Phase 1 | Complete |
| SHR-02 (desktop) | Phase 1 | Pending |
| SHR-03 (desktop) | Phase 1 | Pending |
| SHR-04 | Phase 1 | Complete |
| MOB-01 | Phase 2 | Pending |
| MOB-02 | Phase 2 | Pending |
| MOB-03 | Phase 2 | Pending |
| MOB-04 | Phase 2 | Pending |
| SHR-02 (mobile) | Phase 2 | Pending |
| SHR-03 (mobile) | Phase 2 | Pending |

**Coverage:**

- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-15*
*Last updated: 2026-09-15 after initial definition*
