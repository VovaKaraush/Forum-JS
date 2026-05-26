import express from 'express';
import setupRoutes from './routes/routes.js';
import startdb from './middleware/database.js';
import cwd from 'node:process';
import { start } from 'node:repl';

const app = express();
const port = 8080;

setupRoutes(app);
startdb();


app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});