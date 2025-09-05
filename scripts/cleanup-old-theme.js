/**
 * Script de nettoyage de l'ancien système de thème
 * Supprime tous les anciens boutons et événements
 */

function cleanupOldThemeSystem() {
    console.log('🧹 Nettoyage de l\'ancien système de thème...');
    
    // Liste des anciens IDs de boutons à supprimer
    const oldButtonIds = [
        'theme-toggle',
        'themeToggle',
        'dark-mode-toggle',
        'light-dark-toggle',
        'old-theme-toggle'
    ];
    
    // Supprimer tous les anciens boutons
    oldButtonIds.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            console.log(`🗑️ Suppression de l'ancien bouton: ${id}`);
            button.remove();
        }
    });
    
    // Supprimer les anciens styles
    const oldStyleIds = [
        'theme-toggle-styles',
        'old-theme-styles',
        'legacy-theme-css'
    ];
    
    oldStyleIds.forEach(id => {
        const style = document.getElementById(id);
        if (style && !style.textContent.includes('elegant-theme-toggle')) {
            console.log(`🎨 Suppression des anciens styles: ${id}`);
            style.remove();
        }
    });
    
    // Nettoyer les anciens événements globaux
    if (window.oldThemeManager) {
        console.log('🔧 Suppression de l\'ancien gestionnaire de thème');
        delete window.oldThemeManager;
    }
    
    // Nettoyer les anciens attributs de classe
    document.querySelectorAll('[class*="old-theme"], [class*="legacy-theme"]').forEach(element => {
        element.className = element.className.replace(/\b(old-theme|legacy-theme)[^\s]*/g, '').trim();
    });
    
    // Nettoyer le localStorage d'anciens thèmes
    const oldStorageKeys = ['old-theme', 'legacy-theme', 'dark-mode-preference'];
    oldStorageKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            console.log(`💾 Suppression de l'ancienne clé localStorage: ${key}`);
            localStorage.removeItem(key);
        }
    });
    
    console.log('✅ Nettoyage terminé - Ancien système de thème supprimé');
    
    // Vérifier que le nouveau système fonctionne
    if (window.themeManager && document.getElementById('elegant-theme-toggle')) {
        console.log('✨ Nouveau système de thème élégant actif et fonctionnel');
        return true;
    } else {
        console.warn('⚠️ Le nouveau système de thème n\'est pas encore initialisé');
        return false;
    }
}

// Auto-exécution si le script est chargé directement
if (typeof window !== 'undefined') {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanupOldThemeSystem);
    } else {
        cleanupOldThemeSystem();
    }
}

// Export pour Node.js si nécessaire
if (typeof module !== 'undefined') {
    module.exports = cleanupOldThemeSystem;
}
