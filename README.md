# 3Chan - Forum

Forum communautaire React + Node.js/Express + SQLite.

## Structure

```
Forum-JS/
├── src/                  # Frontend React (Vite)
│   ├── App.jsx           # App principale + toutes les pages
│   ├── api.js            # Helpers fetch vers le backend
│   ├── main.jsx          # Point d'entree React
│   └── style.css         # Styles globaux
├── backend/              # Backend Express + SQLite
│   ├── server.js
│   ├── middleware/
│   │   ├── database.js   # Init BDD + migrations + seed
│   │   └── auth.js       # Session par cookie
│   ├── routes/
│   │   └── routes.js     # Toutes les routes API
│   └── package.json
├── index.html            # Point d'entree Vite
└── vite.config.js        # Proxy /api -> backend:3001
```

## Lancement en dev

### 1. Backend

```bash
cd backend
npm install
npm start
```

Le backend tourne sur http://localhost:3001

### 2. Frontend (autre terminal)

```bash
npm install
npm run dev
```

L'app est disponible sur http://localhost:5173

## Fonctionnalites

- Inscription / Connexion / Deconnexion (session cookie, une session par user)
- Mots de passe hashe (bcrypt)
- Posts avec une ou plusieurs categories + image optionnelle (JPEG/PNG/GIF, max 20 Mo)
- Modifier / supprimer ses propres posts
- Commentaires (CRUD)
- Like / Dislike sur posts et commentaires (toggle)
- Filtrage : par categorie, mes posts, mes likes
- Visiteurs non connectes peuvent lire mais pas poster/commenter/liker
- Gestion des erreurs HTTP (400, 401, 403, 404, 500)

## API Backend (port 3001)

| Methode | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/me | - | Utilisateur courant |
| POST | /api/register | - | Inscription |
| POST | /api/login | - | Connexion |
| POST | /api/logout | - | Deconnexion |
| GET | /api/categories | - | Liste categories |
| GET | /api/posts | - | Liste posts (filtres: category/mine/liked/page) |
| GET | /api/posts/:id | - | Post + commentaires |
| POST | /api/posts | oui | Creer un post |
| PUT | /api/posts/:id | oui | Modifier son post |
| DELETE | /api/posts/:id | oui | Supprimer son post |
| POST | /api/comments | oui | Commenter |
| PUT | /api/comments/:id | oui | Modifier son commentaire |
| DELETE | /api/comments/:id | oui | Supprimer son commentaire |
| POST | /api/like | oui | Like/dislike (toggle) |
