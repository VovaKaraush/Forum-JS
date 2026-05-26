# 3Chan — Maquette Forum

Maquette d'interface d'un forum communautaire inspiré de Reddit, réalisée en HTML/CSS pur.

## Aperçu

**3Chan** est une maquette statique d'un forum de type Reddit. Elle présente une interface complète avec barre de navigation, sidebar, fil de posts et règles du forum.

## Structure du projet

```
Forum-JS/
├── Menu.html     # Page principale du forum
├── style.css     # Feuille de styles complète
└── README.md
```

## Fonctionnalités UI

- **Topbar** — logo, barre de recherche, boutons Connexion / Inscription
- **Sidebar** — carte de bienvenue, navigation (Accueil, Populaire, Nouveautés…)
- **Fil de contenu** — zone de création de post, onglets (Hot / New / Top / Commentés)
- **À propos du forum** — statistiques membres et en ligne
- **Règles** — liste des règles de la communauté
- **Responsive** — mise en page adaptée mobile (< 900 px et < 600 px)

## Technologies

| Technologie | Usage |
|-------------|-------|
| HTML5 | Structure sémantique |
| CSS3 | Mise en page Grid/Flexbox, responsive design |

## Lancer le projet

Ouvrir directement `Menu.html` dans un navigateur — aucun serveur ni dépendance requis.

```bash
# Exemple avec VS Code Live Server
# Clic droit sur Menu.html → "Open with Live Server"
```

## Palette de couleurs

| Rôle | Couleur |
|------|---------|
| Accent principal | `#ff4500` (orange-rouge) |
| Lien / bleu forum | `#0079d3` |
| Fond de page | `#dce3ea` |
| Cartes | `#ffffff` |

## Prochaines étapes envisagées

- [ ] Ajouter des posts dynamiques via JavaScript
- [ ] Système de vote (upvote / downvote) fonctionnel
- [ ] Page de détail d'un post avec commentaires
- [ ] Authentification simulée (connexion / inscription)
- [ ] Mode sombre
