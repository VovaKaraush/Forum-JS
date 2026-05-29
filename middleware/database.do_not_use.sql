

PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT, -- Identifiant unique
    username      TEXT    NOT NULL UNIQUE,           -- Pseudo affiché sur le forum
    email         TEXT    NOT NULL UNIQUE,           -- Email pour la connexion
    password_hash TEXT    NOT NULL,                  -- Mot de passe hashé (jamais en clair)
    role          TEXT    NOT NULL DEFAULT 'member', -- Rôle : member, moderator, admin
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')) -- Date d'inscription
);

CREATE TABLE categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT, -- Identifiant unique
    name        TEXT NOT NULL UNIQUE,              -- Nom de la catégorie (ex: "Général")
    description TEXT                               -- Description optionnelle
);

CREATE TABLE posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,                       -- Identifiant unique
    user_id     INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE, -- Auteur du post
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE, -- Catégorie du post
    title       TEXT    NOT NULL,                                        -- Titre du sujet
    body        TEXT    NOT NULL,                                        -- Contenu du post
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))               -- Date de publication
);

CREATE TABLE comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,                      -- Identifiant unique
    post_id    INTEGER NOT NULL REFERENCES posts(id)  ON DELETE CASCADE, -- Post concerné
    user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE, -- Auteur du commentaire
    content    TEXT    NOT NULL,                                       -- Contenu du commentaire
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))              -- Date de publication
);

CREATE TABLE likes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,                       -- Identifiant unique
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Utilisateur qui like
    target_id  INTEGER NOT NULL REFERENCES posts(id),                                        -- ID du post ou commentaire liké
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),              -- Date du like
    UNIQUE (user_id, target_id)                                         -- Un like par cible par utilisateur
);

CREATE TABLE follows (
    following_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Celui qui suit
    followed_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Celui qui est suivi
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),               -- Date de l'abonnement
    UNIQUE (following_user_id, followed_user_id)                               -- Pas de doublon
);