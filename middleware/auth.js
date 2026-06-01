import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_AUTH_KEY;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_AUTH_KEY, (err, decoded) => {
    if (err) {
      // Token is expired, tampered with, or invalid
      console.log("invalid Auth try")
      return res.status(403).json({success: false, message: 'Invalid or expired token' });
    }

    req.user = decoded; // e.g. { userId: 42, username: "alice", iat: ..., exp: ... }
    console.log(decoded)
    next();
  });
}

export default authenticateToken;