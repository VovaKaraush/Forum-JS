import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import startdb from './middleware/database.js';
import setupRoutes from './routes/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Allow requests from Vite dev server
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

startdb();
setupRoutes(app);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route introuvable' }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
});

app.listen(PORT, () => console.log('Backend lance sur http://localhost:' + PORT));
