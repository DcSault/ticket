/**
 * Script de migration pour mettre à jour toutes les pages HTML
 * avec le nouveau système de thème moderne
 */

const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'public/html');
const files = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));

console.log('🔄 Migration du système de thème...\n');

files.forEach(filename => {
    const filePath = path.join(htmlDir, filename);
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📄 Traitement de ${filename}:`);
    
    // Vérifier si le fichier a déjà été migré
    if (content.includes('theme-init.js')) {
        console.log('   ✅ Déjà migré');
        return;
    }
    
    let modified = false;
    
    // Ajouter theme-init.js dans le head
    if (content.includes('<head>') && !content.includes('theme-init.js')) {
        content = content.replace(
            /(<head>[\s\S]*?<meta name="viewport"[^>]*>)/,
            `$1
    
    <!-- Initialisation du thème AVANT tout le reste pour éviter le flash -->
    <script src="/js/theme-init.js"></script>`
        );
        modified = true;
        console.log('   ✅ Ajout de theme-init.js');
    }
    
    // Ajouter la classe theme-transition au body si pas présente
    if (content.includes('<body') && !content.includes('theme-transition')) {
        content = content.replace(
            /(<body[^>]*class="[^"]*)/,
            '$1 theme-transition'
        );
        if (!content.includes('theme-transition')) {
            content = content.replace(
                /<body([^>]*)>/,
                '<body$1 class="theme-transition">'
            );
        }
        modified = true;
        console.log('   ✅ Ajout de theme-transition au body');
    }
    
    // Vérifier si common.css est inclus
    if (!content.includes('/css/common.css')) {
        // Chercher un autre fichier CSS pour insérer common.css avant
        const cssMatch = content.match(/<link[^>]+href="\/css\/[^"]+\.css"[^>]*>/);
        if (cssMatch) {
            content = content.replace(
                cssMatch[0],
                `<link href="/css/common.css" rel="stylesheet">\n    ${cssMatch[0]}`
            );
            modified = true;
            console.log('   ✅ Ajout de common.css');
        }
    }
    
    // Sauvegarder si modifié
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('   💾 Fichier sauvegardé\n');
    } else {
        console.log('   ℹ️  Aucune modification nécessaire\n');
    }
});

console.log('✨ Migration terminée !');
console.log('\n📋 Résumé:');
console.log(`   • ${files.length} fichiers HTML traités`);
console.log('   • Initialisation du thème ajoutée');
console.log('   • Transitions CSS appliquées');
console.log('   • Compatibilité assurée');

console.log('\n🚀 Prochaines étapes:');
console.log('   1. Testez sur http://localhost:3001/theme-test');
console.log('   2. Vérifiez chaque page: index, login, archives, etc.');
console.log('   3. Le bouton de thème apparaîtra automatiquement en bas à droite');
console.log('   4. Profitez du nouveau système moderne ! 🎨');
