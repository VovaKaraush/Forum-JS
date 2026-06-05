import path from 'path';
import express from 'express';
import cwd from 'node:process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRequire } from "module"; //line added to support require for jwt
const require = createRequire(import.meta.url); //line added to support require for jwt at line
require("dotenv").config(); //this require
import { db } from '../middleware/database.js';
import authenticateToken from '../middleware/auth.js';
import userLiked from '../middleware/likes.js'

const JWT_SECRET = process.env.JWT_AUTH_KEY; // À changer en variable d'environnement en production


function setupPostRoutes(app) {
    // POST Login route
    app.post('/api/login', (req, res) => {
        console.log('route login running')
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
                user.password_hash
            );

            if (!passwordMatch) {
                console.log("User", user.name, "not connected, bad password.")
                return res.status(401).json({
                    success: false,
                    message: 'Pseudo ou mot de passe incorrect'
                });
            }
            
            console.log(user, "user check for token")

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.name,
                    email:user.email
                },
                JWT_SECRET,
                { expiresIn: '2h' }
            );

            res.json({
                success: true,
                message: 'Connexion réussie, cookies enregistrés!',
                token,
                user: {
                    id: user.id,
                    username: user.name,
                }
            });

            console.log('this is the token:', token)
            console.log("User", user.name, "sucessfully connected!")

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
        console.log('route register running');
        try {
            const {
                username,
                email,
                password,
                confirmPassword,
            } = req.body;

            // Validation
            if (!username || !password || !email || !confirmPassword) {
                console.log("One of the fields is empty")
                return res.status(400).json({
                    success: false,
                    message: 'Tous les champs sont requis'
                });
            }

            if (password !== confirmPassword) {
                console.log("not corresponding password for account creation of account", username)
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
                console.log("Email", existingEmail.email, "exists")
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
                console.log("User", existingUser.name, "exists")
                return res.status(409).json({
                    success: false,
                    message: 'Ce pseudo est déjà utilisé'
                });
            }

            // Hash password
            const hashedPassword = bcrypt.hashSync(password, 10);

            // Create user
            const result = db.prepare(
                'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
            ).run(username, email, hashedPassword);

            // Generate JWT token
            /*const token = jwt.sign(
                {
                    id: result.lastInsertRowid,
                    username,
                    email
                },
                JWT_SECRET,
                { expiresIn: '4h' }
            );*/ 
            // !!!!!!!! THE TOKEN WILL NOT BE GENERATED ON ACCOUNT CREATION,!!!!!!!!!!!
            // !!!!!!!!!!!!!!   THE USER HAS TO LOG BY HIMSELF   !!!!!!!!!!!!!!!!!!!!!!

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
        console.log('route like running');
        try {
            const {
                id_post,
                username,
                token
            } = req.body;

            console.log(token);
            const [tokenCheck, verified] = authenticateToken(token);

            if (!tokenCheck){
                throw new Error("The token is either invalid or absent!")
                res.status(403).json({
                    success: false,
                    message: 'Votre token de session est invalide, Connectez vous a nouveau sur votre compte!'
                });
            }

            console.log("token validated :", verified);
            
            const like = userLiked(verified.id, id_post);

            if (like){
                console.log('like mis');
                res.status(201).json({
                    success: true,
                    message: 'like mis avec success',
                });
            } else if (!like){
                console.log('like enleve');
                res.status(201).json({
                    success: true,
                    message: 'like enlevé avec success',
                });
            }

        } catch (error) {
            if (error.message == "The token is either invalid or absent!") {
                console.error("Token invalide: ", error)
                res.status(403).json({
                    success: false,
                    message: 'Your token is not valid, please relogin into your account to fix the problem.'
                });
            } else {
                console.error("Erreur lors de la mise du like:", error);

                res.status(500).json({
                    success: false,
                    message: 'Erreur serveur'
                });
            }

            
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