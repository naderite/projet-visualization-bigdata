#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.utils import ImageReader


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="UniversityTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            alignment=1,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#0B3C5D"),
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#444444"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeBlock",
            parent=styles["BodyText"],
            fontName="Courier",
            fontSize=8,
            leading=10,
            leftIndent=6,
            rightIndent=6,
            backColor=colors.HexColor("#F4F6F8"),
        )
    )
    return styles


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#5a5a5a"))
    canvas.drawString(2 * cm, 1.2 * cm, "Visualisation des Donnees Massives - Rapport de Projet")
    canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}")
    canvas.restoreState()


def bullet_list(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=8) for item in items],
        bulletType="bullet",
        bulletFontName="Helvetica",
        bulletFontSize=8,
        leftIndent=14,
        spaceAfter=6,
    )


def code_snippet(path: Path, start: int, end: int) -> str:
    lines = path.read_text(encoding="utf-8").splitlines()
    selected = lines[start - 1 : end]
    out = []
    for idx, line in enumerate(selected, start=start):
        out.append(f"{idx:>3}: {line}")
    return "\n".join(out)


def scaled_image(img_path: Path, max_width: float, max_height: float) -> Image:
    reader = ImageReader(str(img_path))
    width, height = reader.getSize()
    ratio = min(max_width / width, max_height / height)
    img = Image(str(img_path))
    img.drawWidth = width * ratio
    img.drawHeight = height * ratio
    return img


def build_report(output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Rapport Projet Visualisation Big Data",
        author="Etudiant IDS4",
    )

    today = dt.date.today().strftime("%d/%m/%Y")
    app_js = base / "app.js"
    prep_py = base / "scripts" / "prepare_superstore.py"
    shot_top = base / "assets" / "screenshots" / "dashboard_top.png"
    shot_full = base / "assets" / "screenshots" / "dashboard_full.png"
    story = []

    story.append(Spacer(1, 2.1 * cm))
    story.append(Paragraph("Universite de Tunis El Manar (UTM)", styles["UniversityTitle"]))
    story.append(
        Paragraph(
            "Faculte des Sciences de Tunis (FST)<br/>"
            "Faculte des Sciences Mathematiques, Physiques et Naturelles de Tunis",
            styles["UniversityTitle"],
        )
    )
    story.append(Spacer(1, 1.0 * cm))
    story.append(Paragraph("Rapport de Projet Pratique", styles["Title"]))
    story.append(Paragraph("Visualisation des Donnees Massives (2025-2026)", styles["Heading2"]))
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph("Titre du projet", styles["Section"]))
    story.append(
        Paragraph(
            "Conception d'un dashboard interactif de performance retail avec D3.js",
            styles["Body"],
        )
    )
    story.append(Spacer(1, 0.4 * cm))

    cover_table = Table(
        [
            ["Etudiants", Paragraph("Nader Ben Salah<br/>Nour Ardhaoui", styles["Body"])],
            ["Parcours", "IDS4 - Semestre 2"],
            ["Etablissement", "FST - Universite de Tunis El Manar"],
            ["Adresse", "Campus Universitaire El Manar, 2092 Tunis"],
            ["Contact", "Tel: (+216) 71 872 600 - Email: fst@fst.rnu.tn"],
            ["Site web", "www.fst.rnu.tn"],
            ["Encadrant", "A completer"],
            ["Date de remise", today],
        ],
        colWidths=[5.0 * cm, 9.5 * cm],
    )
    cover_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF1F6")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#B7C4CF")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(cover_table)
    story.append(Spacer(1, 0.9 * cm))
    story.append(
        Paragraph(
            "Mots cles: visualisation interactive, D3.js, data storytelling, dashboard, aide a la decision",
            styles["Small"],
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("1. Contexte et objectifs", styles["Section"]))
    story.append(
        Paragraph(
            "Ce projet repond au sujet pratique du module de Visualisation des Donnees Massives. "
            "L'objectif est de produire une interface analytique claire, interactive et utile pour "
            "l'analyse de performance commerciale, tout en respectant les standards vus en cours (CH1 a CH4, TP1 a TP3).",
            styles["Body"],
        )
    )
    story.append(
        bullet_list(
            [
                "Construire un tableau de bord capable de synthese rapide via des KPI.",
                "Permettre une exploration multi-vues (temps, region, segment, rentabilite).",
                "Demontrer la maitrise des bases D3.js: scales, axes, transitions et interactions.",
                "Fournir une base technique reutilisable pour des analyses futures.",
            ],
            styles["Body"],
        )
    )

    story.append(Paragraph("2. Donnees et preparation", styles["Section"]))
    story.append(
        Paragraph(
            "Le jeu de donnees provient de Sample Superstore (9 994 lignes), pertinent pour la BI "
            "grace a ses dimensions metier (region, segment, categorie) et ses mesures (sales, profit, discount, quantity). "
            "Une phase de preparation est implementee dans <i>scripts/prepare_superstore.py</i>.",
            styles["Body"],
        )
    )
    story.append(
        bullet_list(
            [
                "Normalisation des dates vers un format ISO.",
                "Conversion numerique de toutes les mesures.",
                "Ajout de year_month pour l'analyse temporelle mensuelle.",
                "Calcul de profit_margin et indicateur binaire is_profitable.",
                "Generation du fichier final: data/superstore_clean.csv.",
            ],
            styles["Body"],
        )
    )

    story.append(Paragraph("3. Architecture de la solution", styles["Section"]))
    arch_table = Table(
        [
            ["Composant", "Role principal"],
            ["index.html", "Structure de la page, sections KPI, graphiques et filtres"],
            ["style.css", "Mise en forme, lisibilite, disposition responsive"],
            ["app.js", "Chargement des donnees, filtrage, rendu D3 et interactions"],
            ["vendor/d3.min.js", "Bibliotheque de visualisation D3.js"],
            ["scripts/prepare_superstore.py", "Pipeline de nettoyage et enrichissement des donnees"],
        ],
        colWidths=[4.8 * cm, 9.7 * cm],
    )
    arch_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF1F6")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#B7C4CF")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(arch_table)

    story.append(Paragraph("4. Choix de visualisation", styles["Section"]))
    story.append(
        bullet_list(
            [
                "KPI Cards: total ventes, total profit, marge et nombre de commandes.",
                "Line chart mensuel: comparaison dynamique Sales vs Profit.",
                "Bar chart regional: classement top N selon la metrique choisie.",
                "Donut chart segment: repartition des ventes par profil client.",
                "Scatter plot discount-profit: detection rapide des zones de risque.",
            ],
            styles["Body"],
        )
    )
    story.append(
        Paragraph(
            "Les filtres globaux (periode, region, categorie, segment, metrique, top N) "
            "permettent un cross-filtering complet et un raisonnement analytique progressif.",
            styles["Body"],
        )
    )

    story.append(Paragraph("5. Alignement pedagogique", styles["Section"]))
    story.append(
        Paragraph(
            "L'implementation suit explicitement les methodes des chapitres et TP du cours: "
            "sequence de construction D3 (dimensions, SVG, scales, axes, traces), animation des lignes "
            "via stroke-dasharray/stroke-dashoffset et interactions hover avec transitions courtes.",
            styles["Body"],
        )
    )
    story.append(
        Paragraph(
            "Ce choix garantit une coherence entre attentes academiques et qualite de rendu du projet final.",
            styles["Body"],
        )
    )

    story.append(Paragraph("6. Resultats obtenus", styles["Section"]))
    story.append(
        bullet_list(
            [
                "Lecture immediate des performances globales grace aux KPI.",
                "Identification des tendances mensuelles et des ruptures de profit.",
                "Comparaison regionale pour prioriser les actions commerciales.",
                "Mise en evidence de remises associees a une baisse de rentabilite.",
                "Support direct a la prise de decision orientee profit.",
            ],
            styles["Body"],
        )
    )

    story.append(Paragraph("7. Limites et pistes d'amelioration", styles["Section"]))
    story.append(
        bullet_list(
            [
                "Ajouter un module de prevision temporelle (ARIMA/Prophet).",
                "Introduire des filtres hierarchiques plus fins par sous-categorie.",
                "Connecter le dashboard a une source de donnees temps reel.",
                "Mettre en place des tests automatises pour les fonctions de preparation.",
            ],
            styles["Body"],
        )
    )

    story.append(Paragraph("8. Procedure d'execution", styles["Section"]))
    story.append(
        Paragraph(
            "Depuis le dossier solution, executer successivement les commandes suivantes:",
            styles["Body"],
        )
    )
    story.append(Paragraph("1) python3 scripts/prepare_superstore.py", styles["Body"]))
    story.append(Paragraph("2) python3 -m http.server 8000", styles["Body"]))
    story.append(Paragraph("3) Ouvrir http://localhost:8000", styles["Body"]))

    story.append(Paragraph("9. Conclusion", styles["Section"]))
    story.append(
        Paragraph(
            "Le projet atteint ses objectifs fonctionnels et pedagogiques. "
            "Il propose un dashboard interactif robuste, fonde sur des pratiques D3.js conformes au cours "
            "et oriente vers la decision metier. La solution est exploitable en contexte universitaire "
            "et constitue une base solide pour des extensions avancees.",
            styles["Body"],
        )
    )

    story.append(Paragraph("10. Captures d'ecran du dashboard", styles["Section"]))
    story.append(
        Paragraph(
            "Les captures suivantes illustrent l'interface finale et la structure multi-vues du dashboard.",
            styles["Body"],
        )
    )
    if shot_top.exists():
        story.append(Paragraph("Figure 1 - Vue principale (KPI et premiers graphiques)", styles["Small"]))
        story.append(Spacer(1, 0.12 * cm))
        story.append(scaled_image(shot_top, max_width=16.0 * cm, max_height=10.8 * cm))
        story.append(Spacer(1, 0.35 * cm))
    if shot_full.exists():
        story.append(Paragraph("Figure 2 - Vue etendue du dashboard", styles["Small"]))
        story.append(Spacer(1, 0.12 * cm))
        story.append(scaled_image(shot_full, max_width=16.0 * cm, max_height=16.0 * cm))
        story.append(Spacer(1, 0.35 * cm))

    story.append(Paragraph("11. Extraits de code commentes", styles["Section"]))
    story.append(
        Paragraph(
            "Les extraits ci-dessous montrent la logique de preparation des donnees et la construction des visualisations.",
            styles["Body"],
        )
    )
    story.append(Paragraph("Extrait A - Nettoyage et enrichissement des donnees (prepare_superstore.py)", styles["Small"]))
    story.append(
        Preformatted(
            code_snippet(prep_py, 119, 150),
            styles["CodeBlock"],
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph("Extrait B - KPI et line chart D3.js (app.js)", styles["Small"]))
    story.append(
        Preformatted(
            code_snippet(app_js, 148, 180),
            styles["CodeBlock"],
        )
    )
    story.append(Spacer(1, 0.1 * cm))

    story.append(Paragraph("References", styles["Section"]))
    story.append(
        bullet_list(
            [
                "Support de cours CH1, Chapitre 2, Chapitre 3, Chapitre 4.",
                "Travaux pratiques TP1, TP2, TP3 (2025).",
                "Documentation officielle D3.js: https://d3js.org",
                "Fichiers du projet: RAPPORT_PROJET.md et ALIGNEMENT_COURS.md.",
                "UTM - Etablissement FST (consulte le 05/03/2026): "
                "https://utm.rnu.tn/utm/fr/etablissements--faculte-des-sciences-mathematiques-physiques-et-naturelles-de-tunis",
                "Portail universitaire (consulte le 05/03/2026): "
                "https://www.universite.tn/Universite-de-Tunis-El-Manar/faculte-des-sciences-de-tunis.html",
            ],
            styles["Body"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    base = Path(__file__).resolve().parents[1]
    output = base / "RAPPORT_PROJET_UNIVERSITAIRE.pdf"
    build_report(output)
    print(output)
