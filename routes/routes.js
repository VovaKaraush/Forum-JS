import path from 'path';
import express from 'express';
import cwd from 'node:process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../middleware/database.js';

const JWT_SECRET = 'your-secret-key'; // À changer en variable d'environnement en production


function setupPostRoutes(app) {
    // POST Login route
    app.post('/api/login', (req, res) => {
        try {
            const { username, password } = req.body;

            // Validation
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Le pseudo et le mot de passe sont requis'
                });
            }

            // Check if user exists
            const user = db.prepare(
                'SELECT * FROM users WHERE name = ?'
            ).get(username);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Pseudo ou mot de passe incorrect'
                });
            }

            // Check password
            const passwordMatch = bcrypt.compareSync(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Pseudo ou mot de passe incorrect'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.name,
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Connexion réussie',
                token,
                user: {
                    id: user.id,
                    username: user.name,
                }
            });

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);

            res.status(500).json({
                success: false,
                message: 'Erreur serveur de login'
            });
        }
    });

    // POST Register route
    app.post('/api/register', (req, res) => {
        try {
            const {
                username,
                email,
                password,
                confirmPassword,
            } = req.body;

            // Validation
            if (!username || !password || !email || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les champs sont requis'
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Les mots de passe ne correspondent pas'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Le mot de passe doit contenir au moins 6 caractères'
                });
            }

            const existingEmail = db.prepare(
                'SELECT * FROM users WHERE email = ?'
            ).get(email);

            if (existingEmail){
                return res.status(409).json({
                    success: false,
                    message: 'Ce mail est déjà utilisé'
                });
            }

            // Check if username already exists
            const existingUser = db.prepare(
                'SELECT * FROM users WHERE name = ?'
            ).get(username);

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Ce pseudo est déjà utilisé'
                });
            }

            // Hash password
            const hashedPassword = bcrypt.hashSync(password, 10);

            // Create user
            const result = db.prepare(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
            ).run(username, email, hashedPassword);

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: result.lastInsertRowid,
                    username,
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'Compte créé avec succès',
                token,
                user: {
                    id: result.lastInsertRowid,
                    username,
                }
            });

        } catch (error) {
            console.error("Erreur lors de l'inscription:", error);

            res.status(500).json({
                success: false,
                message: 'Erreur serveur d\'inscription'
            });
        }
    });

    //POST route for a like
    app.post('/api/like', (req, res) => {
        try {
            const {
                id_post,
                id_user,
            } = req.body;


        } catch (error) {
            console.error("Erreur lors de la mise du like:", error);

            res.status(500).json({
                success: false,
                message: 'erreur serveur'
            });
        }
    });
};

//setting up mostly get routes, as post routes are used for logging in and are more considered as middleware
function setupRoutes(app) {
    // Initialize POST routes
    setupPostRoutes(app);

    // Get the Home Page
    app.get('/', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'public', 'login.html'));
        console.log("Root requested");
    });

};

export default setupRoutes;