import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../db/forum.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function startdb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL UNIQUE,
            email         TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL DEFAULT 'MEMBER',
            created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id         TEXT PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS categories (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL UNIQUE,
            description TEXT
        );
        CREATE TABLE IF NOT EXISTS posts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title      TEXT NOT NULL,
            body       TEXT NOT NULL,
            image_url  TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS post_categories (
            post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            PRIMARY KEY (post_id, category_id)
        );
        CREATE TABLE IF NOT EXISTS comments (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content    TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS likes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            target_id   INTEGER NOT NULL,
            target_type TEXT NOT NULL CHECK(target_type IN ('post', 'comment')),
            type        TEXT NOT NULL CHECK(type IN ('like', 'dislike')),
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (user_id, target_id, target_type)
        );
    `);

    const catCount = db.prepare('SELECT COUNT(*) as n FROM categories').get();
    if (catCount.n === 0) {
        const ins = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
        db.transaction(() => {
            ins.run('General', 'Discussions generales');
            ins.run('Technologie', 'Tech, code, hardware');
            ins.run('Actualites', 'News et evenements');
            ins.run('Jeux video', 'Gaming et esport');
            ins.run('Musique', 'Partage musical');
            ins.run('Films et Series', 'Cinema et streaming');
            ins.run('Sport', 'Sports et competitions');
            ins.run('Science', 'Sciences et decouvertes');
        })();
    }
}

export default startdb;
export { db };
