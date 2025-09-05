const express = require('express');
const path = require('path');
const app = express();

// Configuration pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route pour la page de test
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'theme-test.html'));
});

// Route pour tester le thème sur une page de tickets
app.get('/test-tickets', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html class="dark:bg-gray-900">
<head>
    <title>Test Tickets avec Thème</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Initialisation du thème -->
    <script src="/js/theme-init.js"></script>
    
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="/css/common.css" rel="stylesheet">
    <link href="/css/ultra-smooth-theme-button.css" rel="stylesheet">
</head>
<body class="theme-transition" style="background-color: var(--bg-primary) !important; color: var(--text-primary) !important;">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8 text-center">🎫 Simulation des Tickets</h1>
        
        <!-- Simulation d'une liste de tickets -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div class="ticket-card p-4 rounded-lg border" style="background-color: var(--surface); border-color: var(--border-primary);">
                <h3 class="font-bold text-lg mb-2" style="color: var(--text-primary);">Ticket #001</h3>
                <p class="mb-2" style="color: var(--text-secondary);">Problème avec l'impression</p>
                <div class="flex justify-between items-center">
                    <span class="px-2 py-1 text-xs rounded" style="background-color: var(--danger); color: white;">Urgent</span>
                    <span style="color: var(--text-muted);">12/01/2024</span>
                </div>
            </div>
            
            <div class="ticket-card p-4 rounded-lg border" style="background-color: var(--surface); border-color: var(--border-primary);">
                <h3 class="font-bold text-lg mb-2" style="color: var(--text-primary);">Ticket #002</h3>
                <p class="mb-2" style="color: var(--text-secondary);">Configuration réseau</p>
                <div class="flex justify-between items-center">
                    <span class="px-2 py-1 text-xs rounded" style="background-color: var(--warning); color: white;">Moyen</span>
                    <span style="color: var(--text-muted);">11/01/2024</span>
                </div>
            </div>
            
            <div class="ticket-card p-4 rounded-lg border" style="background-color: var(--surface); border-color: var(--border-primary);">
                <h3 class="font-bold text-lg mb-2" style="color: var(--text-primary);">Ticket #003</h3>
                <p class="mb-2" style="color: var(--text-secondary);">Mise à jour logiciel</p>
                <div class="flex justify-between items-center">
                    <span class="px-2 py-1 text-xs rounded" style="background-color: var(--success); color: white;">Faible</span>
                    <span style="color: var(--text-muted);">10/01/2024</span>
                </div>
            </div>
        </div>
        
        <!-- Contrôles de test -->
        <div class="mt-8 p-4 rounded-lg" style="background-color: var(--surface); border: 1px solid var(--border-primary);">
            <h2 class="text-xl font-bold mb-4" style="color: var(--text-primary);">Contrôles de Test</h2>
            <div class="flex gap-4">
                <button onclick="window.themeManager?.setTheme('light')" class="px-4 py-2 rounded" style="background-color: var(--primary); color: white;">
                    Mode Clair
                </button>
                <button onclick="window.themeManager?.setTheme('dark')" class="px-4 py-2 rounded" style="background-color: var(--primary); color: white;">
                    Mode Sombre
                </button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="/js/common.js"></script>
    <script src="/js/themeManager.js"></script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Serveur de test de thème démarré sur http://localhost:${PORT}`);
    console.log(`📄 Page de test principale: http://localhost:${PORT}/`);
    console.log(`🎫 Test tickets: http://localhost:${PORT}/test-tickets`);
});
