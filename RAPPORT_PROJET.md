# Rapport Projet Pratique - Dashboard Retail D3.js

## 1) Objectif
Realiser une visualisation interactive D3.js de niveau professionnel, avec des donnees business riches, tout en restant alignee avec les pratiques de codage du professeur (CH1-CH4, TP1-TP3).

## 2) Jeu de donnees
- Source: Sample Superstore (dataset public externe)
- Volume: 9,994 lignes
- Pourquoi ce choix:
  - dimensions metier reelles (`region`, `segment`, `category`, `sub_category`),
  - mesures business coherentes (`sales`, `profit`, `discount`, `quantity`),
  - supporte des KPIs et un storytelling de performance.

## 3) Pipeline de preparation
Script: `scripts/prepare_superstore.py`

Transformations clefs:
- normalisation des dates en format ISO,
- conversion numerique des mesures,
- creation de `year_month`,
- creation de `profit_margin` et `is_profitable`.

Sortie: `data/superstore_clean.csv`

## 4) Dashboard construit
### Vue 1 - KPI cards
- Total Sales
- Total Profit
- Profit Margin
- Nombre de commandes

### Vue 2 - Tendance mensuelle (Line chart)
- Deux series (`Sales` et `Profit`) sur une echelle temporelle
- Animation de dessin progressif des lignes
- Hover line interaction (stroke-width/opacite, 50ms)

### Vue 3 - Performance par region (Bar chart)
- Classement par metrique selectionnee (`Sales` ou `Profit`)
- Highlight positif/negatif pour lecture immediate du risque

### Vue 4 - Repartition des ventes par segment (Donut)
- Part de chiffre d'affaires par type de client

### Vue 5 - Discount vs Profit (Scatter)
- Detection visuelle de zones de perte associees aux remises

### Controles globaux
- Periode (mois debut/fin)
- Region
- Category
- Segment
- Metrique (Sales/Profit)
- Top N regions

## 5) Alignement pedagogique
Le code applique les patterns vus en cours:
- sequence de construction D3 (dimensions, SVG, donnees, scales, axes, tracage, legendes),
- line chart temporel multiseries,
- transitions et interactions de type TP3.

Voir le mapping detaille dans `ALIGNEMENT_COURS.md`.

## 6) Resultats et valeur metier
Le dashboard permet de:
- isoler les zones rentables et deficitaires,
- comparer la performance regionale rapidement,
- evaluer l'impact potentiel des remises,
- soutenir une prise de decision orientee profit.

## 7) Execution
Depuis le dossier `solution/`:
1. `python3 scripts/prepare_superstore.py`
2. `python3 -m http.server 8000`
3. ouvrir `http://localhost:8000`
