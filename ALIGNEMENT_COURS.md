# Alignement Avec Le Cours (CH1-CH4, TP1-TP3)

## Materiels pris en compte
- `announcements/attachments/CH1.pdf`
- `announcements/attachments/Chapitre 2.pdf`
- `announcements/attachments/Chapitre 3.pdf`
- `announcements/attachments/Chapitre 4.pdf`
- `tp1-tableau-public__/attachments/TP1.pdf`
- `tp2__/attachments/TP2.pdf`
- `tp3__/attachments/TP3 (2025).pdf`

## Mapping implementation -> cours
- Structure D3 par etapes (dimensions, SVG, collecte, regroupement, scales, colors, axes, tracage, legendes): appliquee dans `app.js` pour chaque graphe, conformement a la sequence presentee en Chapitre 4 et TP3.
- Line chart temporel: reprise de la logique TP3 (Line Chart) avec deux series (`sales`, `profit`) et regroupement temporel par mois.
- Animations D3:
  - dessin progressif des lignes via `stroke-dasharray` / `stroke-dashoffset` (TP3 Ex2),
  - interaction hover sur les courbes avec transition 50ms sur `stroke-width` et `opacity` (TP3 Ex3).
- Axes, labels, legendes: presents systematiquement comme demande dans TP3 Ex1/Ex4.
- Interaction utilisateur (filtres, tooltips, transitions): extension pratique du cours pour repondre au sujet "visualisation interactive" du projet pratique.
- Data storytelling metier: enrichissement volontaire (KPIs business + cross-filtering) pour depasser un rendu purement academique et viser un niveau de presentation A.
