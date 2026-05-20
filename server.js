const express = require('express');
const setupRoutes = require('./functions/routes.js');
const startdb = require('./functions/database.js');
const nodemon = require('nodemon')
import cwd from 'node:process';

const app = express();
const port = 8080;


app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});