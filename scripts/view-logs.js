#!/usr/bin/env node

/**
 * Visualisateur de logs - Permet de consulter facilement les logs de l'application
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');

function formatLogEntry(line) {
    try {
        const entry = JSON.parse(line);
        const timestamp = entry.timestamp;
        const level = entry.level.padEnd(7);
        const category = entry.category ? `[${entry.category}]`.padEnd(15) : ''.padEnd(15);
        
        let output = `${timestamp} ${level} ${category} ${entry.message}`;
        
        if (entry.data) {
            output += '\n    Data: ' + JSON.stringify(entry.data, null, 4).split('\n').join('\n    ');
        }
        
        return output;
    } catch (e) {
        return line; // Retourner la ligne brute si le parsing échoue
    }
}

function showLogs(category = null, lines = 50) {
    if (!fs.existsSync(logsDir)) {
        console.log('❌ Répertoire de logs non trouvé:', logsDir);
        return;
    }

    let logFile = path.join(logsDir, 'app.log');
    
    if (category) {
        logFile = path.join(logsDir, `${category}.log`);
    }

    if (!fs.existsSync(logFile)) {
        console.log('❌ Fichier de log non trouvé:', logFile);
        console.log('📁 Fichiers disponibles:');
        const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
        files.forEach(file => console.log(`   - ${file.replace('.log', '')}`));
        return;
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const logLines = content.trim().split('\n').filter(line => line.trim());
    
    console.log(`📋 Logs${category ? ` [${category.toUpperCase()}]` : ''} - ${logLines.length} entrées (${lines} dernières)`);
    console.log('═'.repeat(80));
    
    // Afficher les N dernières lignes
    const recentLines = logLines.slice(-lines);
    recentLines.forEach(line => {
        console.log(formatLogEntry(line));
        console.log('-'.repeat(80));
    });
}

function listCategories() {
    if (!fs.existsSync(logsDir)) {
        console.log('❌ Répertoire de logs non trouvé:', logsDir);
        return;
    }

    const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
    
    console.log('📁 Catégories de logs disponibles:');
    files.forEach(file => {
        const category = file.replace('.log', '');
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim()).length;
        
        console.log(`   - ${category.padEnd(15)} (${lines} entrées, ${(stats.size / 1024).toFixed(1)}KB)`);
    });
}

// Interface en ligne de commande
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'list':
    case 'ls':
        listCategories();
        break;
        
    case 'ticket':
    case 'edit':
        showLogs('TICKET_EDIT', parseInt(args[1]) || 50);
        break;
        
    case 'error':
        showLogs('ERROR', parseInt(args[1]) || 50);
        break;
        
    case 'all':
        showLogs(null, parseInt(args[1]) || 50);
        break;
        
    default:
        console.log(`
📋 Visualisateur de logs - Usage:

node scripts/view-logs.js <commande> [options]

Commandes:
  list, ls              Liste les catégories de logs disponibles
  ticket, edit [N]      Affiche les N derniers logs d'édition de tickets (défaut: 50)
  error [N]             Affiche les N derniers logs d'erreur (défaut: 50)  
  all [N]               Affiche tous les logs (défaut: 50)

Exemples:
  node scripts/view-logs.js list
  node scripts/view-logs.js ticket 20
  node scripts/view-logs.js error
        `);
        break;
}