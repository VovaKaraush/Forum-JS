import { db } from './database.js';

export function sessionMiddleware(req, res, next) {
    const sessionId = req.cookies && req.cookies.session_id;
    if (!sessionId) { req.user = null; return next(); }

    const session = db.prepare(
        "SELECT s.*, u.id as uid, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > datetime('now')"
    ).get(sessionId);

    if (!session) { res.clearCookie('session_id'); req.user = null; return next(); }
    req.user = { id: session.uid, name: session.name, email: session.email, role: session.role };
    next();
}

export function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Connexion requise' });
    next();
}
