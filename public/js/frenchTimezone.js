/**
 * Utilitaires JavaScript pour la gestion du timezone français
 * Côté client (navigateur)
 */

// Fonction utilitaire pour extraire les composants d'une date pour l'affichage local
function extractFrenchComponents(utcDate) {
    const date = utcDate instanceof Date ? utcDate : new Date(utcDate);
    
    // Utiliser directement les composants locaux de la date
    // JavaScript convertit automatiquement en heure locale du client
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        formattedDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        formattedTime: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    };
}

// Fonction pour créer une date UTC à partir de l'heure locale saisie
function createUTCFromLocalTime(dateStr, timeStr) {
    // Créer une date avec l'heure locale saisie
    const localDateTime = new Date(`${dateStr}T${timeStr}:00`);
    
    // La retourner directement - JavaScript s'occupe de la conversion
    return localDateTime;
}

// Fonction pour obtenir les informations de timezone
function getFrenchTimezoneInfo() {
    const now = new Date();
    
    // Obtenir le décalage actuel
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const frenchTime = new Date(utcTime + (1 * 3600000)); // +1h de base
    
    // Détecter l'heure d'été en comparant avec une date fixe
    const janDate = new Date(now.getFullYear(), 0, 1);
    const julDate = new Date(now.getFullYear(), 6, 1);
    
    const janOffset = new Date(janDate.toLocaleString("en-US", {timeZone: "Europe/Paris"})).getHours() - janDate.getUTCHours();
    const julOffset = new Date(julDate.toLocaleString("en-US", {timeZone: "Europe/Paris"})).getHours() - julDate.getUTCHours();
    
    const isDST = julOffset > janOffset;
    const currentOffset = isDST ? 2 : 1;
    
    return {
        timeZone: 'Europe/Paris',
        isDST: isDST,
        offset: currentOffset,
        offsetString: `UTC+${currentOffset}`,
        season: isDST ? 'été (CEST)' : 'hiver (CET)',
        name: isDST ? 'Central European Summer Time' : 'Central European Time'
    };
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.extractFrenchComponents = extractFrenchComponents;
    window.createUTCFromLocalTime = createUTCFromLocalTime;
    window.getFrenchTimezoneInfo = getFrenchTimezoneInfo;
}