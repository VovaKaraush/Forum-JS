const express = require('express');
import cwd from 'node:process';

const app = express();

const port = 8080;

app.get('/', (req, res) => {
        console.log("Root requested");
        res.sendFile(path.join(process.cwd(), 'public', 'login', 'login.html'));
    });

app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});