/**
 * Serveur de test simple pour démontrer le système de thème moderne
 * Sans base de données - juste pour tester l'interface
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware pour servir les fichiers statiques
app.use(express.static('public'));

// Routes de test
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/theme-test.html'));
});

app.get('/theme-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/theme-test.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.get('/archives', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/archives.html'));
});

// Démarrage du serveur de test
app.listen(PORT, () => {
    console.log(`🚀 Serveur de test du système de thème démarré`);
    console.log(`📱 Test complet: http://localhost:${PORT}/theme-test`);
    console.log(`🏠 Page principale: http://localhost:${PORT}/index`);
    console.log(`🔐 Page login: http://localhost:${PORT}/login`);
    console.log(`📦 Archives: http://localhost:${PORT}/archives`);
    console.log(`\n✨ Testez le nouveau système de thème moderne !`);
});

module.exports = app;
