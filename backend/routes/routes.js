import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import { db } from '../middleware/database.js';
import { sessionMiddleware, requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file.originalname).toLowerCase());
        ok ? cb(null, true) : cb(new Error('Format non supporte'));
    }
});

function cookieOpts() {
    return { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' };
}

function makeSession(userId) {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    const id = uuidv4();
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, exp);
    return id;
}

export default function setupRoutes(app) {

    /* ── AUTH ─────────────────────────────────── */

    app.post('/api/register', (req, res) => {
        try {
            const { username, email, password, confirmPassword } = req.body;
            if (!username || !email || !password || !confirmPassword)
                return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
            if (password !== confirmPassword)
                return res.status(400).json({ success: false, message: 'Les mots de passe ne correspondent pas' });
            if (password.length < 6)
                return res.status(400).json({ success: false, message: 'Mot de passe trop court (6 car. min)' });
            if (db.prepare('SELECT id FROM users WHERE email = ?').get(email))
                return res.status(409).json({ success: false, message: 'Email deja utilise' });
            if (db.prepare('SELECT id FROM users WHERE name = ?').get(username))
                return res.status(409).json({ success: false, message: 'Pseudo deja utilise' });

            const hash = bcrypt.hashSync(password, 10);
            const r = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);
            const sid = makeSession(r.lastInsertRowid);
            res.cookie('session_id', sid, cookieOpts());
            res.status(201).json({ success: true, user: { id: r.lastInsertRowid, name: username, role: 'MEMBER' } });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    app.post('/api/login', (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password)
                return res.status(400).json({ success: false, message: 'Champs requis' });
            const user = db.prepare('SELECT * FROM users WHERE name = ?').get(username);
            if (!user || !bcrypt.compareSync(password, user.password_hash))
                return res.status(401).json({ success: false, message: 'Pseudo ou mot de passe incorrect' });
            const sid = makeSession(user.id);
            res.cookie('session_id', sid, cookieOpts());
            res.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    app.post('/api/logout', sessionMiddleware, (req, res) => {
        const sid = req.cookies && req.cookies.session_id;
        if (sid) { db.prepare('DELETE FROM sessions WHERE id = ?').run(sid); res.clearCookie('session_id'); }
        res.json({ success: true });
    });

    app.get('/api/me', sessionMiddleware, (req, res) => res.json({ user: req.user || null }));

    /* ── CATEGORIES ───────────────────────────── */

    app.get('/api/categories', (req, res) => {
        res.json({ success: true, categories: db.prepare('SELECT * FROM categories ORDER BY name').all() });
    });

    /* ── POSTS ────────────────────────────────── */

    app.get('/api/posts', sessionMiddleware, (req, res) => {
        try {
            const { category, mine, liked, page = 1 } = req.query;
            const limit = 20, offset = (parseInt(page) - 1) * limit;
            const uid = req.user ? req.user.id : null;

            let q = `
                SELECT p.*, u.name AS author,
                    GROUP_CONCAT(DISTINCT c.name) AS categories,
                    COUNT(DISTINCT cm.id) AS comment_count,
                    SUM(CASE WHEN l.type='like' THEN 1 ELSE 0 END) AS likes,
                    SUM(CASE WHEN l.type='dislike' THEN 1 ELSE 0 END) AS dislikes
                FROM posts p
                JOIN users u ON u.id = p.user_id
                LEFT JOIN post_categories pc ON pc.post_id = p.id
                LEFT JOIN categories c ON c.id = pc.category_id
                LEFT JOIN comments cm ON cm.post_id = p.id
                LEFT JOIN likes l ON l.target_id = p.id AND l.target_type = 'post'
            `;
            const conds = [], params = [];
            if (category) { conds.push('EXISTS (SELECT 1 FROM post_categories pc2 JOIN categories c2 ON c2.id=pc2.category_id WHERE pc2.post_id=p.id AND c2.id=?)'); params.push(parseInt(category)); }
            if (mine === 'true' && uid) { conds.push('p.user_id = ?'); params.push(uid); }
            if (liked === 'true' && uid) { conds.push("EXISTS (SELECT 1 FROM likes lf WHERE lf.target_id=p.id AND lf.target_type='post' AND lf.type='like' AND lf.user_id=?)"); params.push(uid); }
            if (conds.length) q += ' WHERE ' + conds.join(' AND ');
            q += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const posts = db.prepare(q).all(...params).map(p => {
                const vote = uid ? db.prepare('SELECT type FROM likes WHERE user_id=? AND target_id=? AND target_type=?').get(uid, p.id, 'post') : null;
                return { ...p, categories: p.categories ? p.categories.split(',') : [], myVote: vote ? vote.type : null };
            });
            res.json({ success: true, posts });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    app.get('/api/posts/:id', sessionMiddleware, (req, res) => {
        try {
            const pid = parseInt(req.params.id);
            const uid = req.user ? req.user.id : null;
            const post = db.prepare(`
                SELECT p.*, u.name AS author,
                    GROUP_CONCAT(DISTINCT c.name) AS categories,
                    SUM(CASE WHEN l.type='like' THEN 1 ELSE 0 END) AS likes,
                    SUM(CASE WHEN l.type='dislike' THEN 1 ELSE 0 END) AS dislikes
                FROM posts p JOIN users u ON u.id=p.user_id
                LEFT JOIN post_categories pc ON pc.post_id=p.id
                LEFT JOIN categories c ON c.id=pc.category_id
                LEFT JOIN likes l ON l.target_id=p.id AND l.target_type='post'
                WHERE p.id=? GROUP BY p.id
            `).get(pid);
            if (!post) return res.status(404).json({ success: false, message: 'Post introuvable' });

            const comments = db.prepare(`
                SELECT cm.*, u.name AS author,
                    SUM(CASE WHEN l.type='like' THEN 1 ELSE 0 END) AS likes,
                    SUM(CASE WHEN l.type='dislike' THEN 1 ELSE 0 END) AS dislikes
                FROM comments cm JOIN users u ON u.id=cm.user_id
                LEFT JOIN likes l ON l.target_id=cm.id AND l.target_type='comment'
                WHERE cm.post_id=? GROUP BY cm.id ORDER BY cm.created_at ASC
            `).all(pid);

            const pVote = uid ? db.prepare('SELECT type FROM likes WHERE user_id=? AND target_id=? AND target_type=?').get(uid, pid, 'post') : null;
            const cVotes = {};
            if (uid) comments.forEach(c => { const v = db.prepare('SELECT type FROM likes WHERE user_id=? AND target_id=? AND target_type=?').get(uid, c.id, 'comment'); cVotes[c.id] = v ? v.type : null; });

            res.json({
                success: true,
                post: { ...post, categories: post.categories ? post.categories.split(',') : [], myVote: pVote ? pVote.type : null },
                comments: comments.map(c => ({ ...c, myVote: cVotes[c.id] || null }))
            });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    app.post('/api/posts', sessionMiddleware, requireAuth, upload.single('image'), (req, res) => {
        try {
            const { title, body, categories } = req.body;
            if (!title || !body) return res.status(400).json({ success: false, message: 'Titre et contenu requis' });
            const catIds = categories ? (Array.isArray(categories) ? categories : [categories]).map(Number).filter(Boolean) : [];
            if (!catIds.length) return res.status(400).json({ success: false, message: 'Au moins une categorie requise' });

            const imageUrl = req.file ? '/uploads/' + req.file.filename : null;
            const r = db.prepare('INSERT INTO posts (user_id, title, body, image_url) VALUES (?, ?, ?, ?)').run(req.user.id, title.trim(), body.trim(), imageUrl);
            const pid = r.lastInsertRowid;
            const ins = db.prepare('INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)');
            db.transaction(ids => ids.forEach(cid => ins.run(pid, cid)))(catIds);
            res.status(201).json({ success: true, postId: pid });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    app.put('/api/posts/:id', sessionMiddleware, requireAuth, (req, res) => {
        try {
            const pid = parseInt(req.params.id);
            const post = db.prepare('SELECT * FROM posts WHERE id=?').get(pid);
            if (!post) return res.status(404).json({ success: false, message: 'Post introuvable' });
            if (post.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Non autorise' });
            const { title, body } = req.body;
            if (!title || !body) return res.status(400).json({ success: false, message: 'Titre et contenu requis' });
            db.prepare("UPDATE posts SET title=?, body=?, updated_at=datetime('now') WHERE id=?").run(title.trim(), body.trim(), pid);
            res.json({ success: true });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    app.delete('/api/posts/:id', sessionMiddleware, requireAuth, (req, res) => {
        try {
            const pid = parseInt(req.params.id);
            const post = db.prepare('SELECT * FROM posts WHERE id=?').get(pid);
            if (!post) return res.status(404).json({ success: false, message: 'Post introuvable' });
            if (post.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Non autorise' });
            db.prepare('DELETE FROM posts WHERE id=?').run(pid);
            res.json({ success: true });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    /* ── COMMENTS ─────────────────────────────── */

    app.post('/api/comments', sessionMiddleware, requireAuth, (req, res) => {
        try {
            const { post_id, content } = req.body;
            if (!post_id || !content) return res.status(400).json({ success: false, message: 'post_id et contenu requis' });
            if (!db.prepare('SELECT id FROM posts WHERE id=?').get(post_id)) return res.status(404).json({ success: false, message: 'Post introuvable' });
            const r = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').run(parseInt(post_id), req.user.id, content.trim());
            res.status(201).json({ success: true, commentId: r.lastInsertRowid });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    app.put('/api/comments/:id', sessionMiddleware, requireAuth, (req, res) => {
        try {
            const cid = parseInt(req.params.id);
            const c = db.prepare('SELECT * FROM comments WHERE id=?').get(cid);
            if (!c) return res.status(404).json({ success: false, message: 'Commentaire introuvable' });
            if (c.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Non autorise' });
            const { content } = req.body;
            if (!content) return res.status(400).json({ success: false, message: 'Contenu requis' });
            db.prepare("UPDATE comments SET content=?, updated_at=datetime('now') WHERE id=?").run(content.trim(), cid);
            res.json({ success: true });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    app.delete('/api/comments/:id', sessionMiddleware, requireAuth, (req, res) => {
        try {
            const cid = parseInt(req.params.id);
            const c = db.prepare('SELECT * FROM comments WHERE id=?').get(cid);
            if (!c) return res.status(404).json({ success: false, message: 'Commentaire introuvable' });
            if (c.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Non autorise' });
            db.prepare('DELETE FROM comments WHERE id=?').run(cid);
            res.json({ success: true });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });

    /* ── LIKES ────────────────────────────────── */

    app.post('/api/like', sessionMiddleware, requireAuth, (req, res) => {
        try {
            const { target_id, target_type, type } = req.body;
            if (!target_id || !['post','comment'].includes(target_type) || !['like','dislike'].includes(type))
                return res.status(400).json({ success: false, message: 'Parametres invalides' });
            const tid = parseInt(target_id);
            const ex = db.prepare('SELECT * FROM likes WHERE user_id=? AND target_id=? AND target_type=?').get(req.user.id, tid, target_type);
            let action;
            if (!ex) { db.prepare('INSERT INTO likes (user_id, target_id, target_type, type) VALUES (?, ?, ?, ?)').run(req.user.id, tid, target_type, type); action = 'added'; }
            else if (ex.type === type) { db.prepare('DELETE FROM likes WHERE id=?').run(ex.id); action = 'removed'; }
            else { db.prepare('UPDATE likes SET type=? WHERE id=?').run(type, ex.id); action = 'changed'; }
            const counts = db.prepare("SELECT SUM(CASE WHEN type='like' THEN 1 ELSE 0 END) as likes, SUM(CASE WHEN type='dislike' THEN 1 ELSE 0 END) as dislikes FROM likes WHERE target_id=? AND target_type=?").get(tid, target_type);
            res.json({ success: true, action, likes: counts.likes || 0, dislikes: counts.dislikes || 0 });
        } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur' }); }
    });
}
