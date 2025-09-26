/**
 * Utilitaires pour la gestion du timezone français (Europe/Paris)
 * Gère automatiquement l'heure d'été (CEST) et l'heure d'hiver (CET)
 */

class FrenchTimezone {
    constructor() {
        this.timezone = 'Europe/Paris';
    }

    /**
     * Obtient la date actuelle en heure française
     * @returns {Date} Date actuelle en timezone français
     */
    now() {
        return new Date(new Date().toLocaleString("en-US", {timeZone: this.timezone}));
    }

    /**
     * Convertit une date UTC vers l'heure française
     * @param {Date|string} utcDate - Date en UTC
     * @returns {Date} Date convertie en heure française
     */
    fromUTC(utcDate) {
        const date = utcDate instanceof Date ? utcDate : new Date(utcDate);
        return new Date(date.toLocaleString("en-US", {timeZone: this.timezone}));
    }

    /**
     * Convertit une heure française vers UTC pour stockage
     * @param {Date|string} frenchDate - Date en heure française
     * @returns {Date} Date convertie en UTC
     */
    toUTC(frenchDate) {
        const date = frenchDate instanceof Date ? frenchDate : new Date(frenchDate);
        
        // Créer une date en considérant les composants comme heure française
        const frenchTime = new Date(date.toLocaleString("en-US", {timeZone: "UTC"}));
        const utcTime = new Date(date.toLocaleString("en-US", {timeZone: this.timezone}));
        
        // Calculer le décalage et l'appliquer
        const offset = frenchTime.getTime() - utcTime.getTime();
        return new Date(date.getTime() + offset);
    }

    /**
     * Formate une date en heure française
     * @param {Date|string} date - Date à formater
     * @param {Object} options - Options de formatage
     * @returns {string} Date formatée
     */
    format(date, options = {}) {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: this.timezone
        };
        
        return dateObj.toLocaleString('fr-FR', { ...defaultOptions, ...options });
    }

    /**
     * Obtient des informations sur le timezone actuel
     * @param {Date} date - Date pour laquelle obtenir les infos (défaut: maintenant)
     * @returns {Object} Informations sur le timezone
     */
    getTimezoneInfo(date = new Date()) {
        const formatter = new Intl.DateTimeFormat('fr-FR', {
            timeZone: this.timezone,
            timeZoneName: 'long'
        });
        
        const parts = formatter.formatToParts(date);
        const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
        
        // Déterminer le décalage UTC
        const utcDate = new Date(date.toLocaleString("en-US", {timeZone: "UTC"}));
        const localDate = new Date(date.toLocaleString("en-US", {timeZone: this.timezone}));
        const offsetHours = (localDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
        
        const isDST = offsetHours === 2; // +2h en été, +1h en hiver
        
        return {
            timeZone: this.timezone,
            timeZoneName: timeZoneName,
            offsetHours: offsetHours,
            offsetString: `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`,
            isDST: isDST,
            season: isDST ? 'été (CEST)' : 'hiver (CET)'
        };
    }

    /**
     * Parse une date/heure saisie comme heure française
     * @param {string} dateStr - Date au format YYYY-MM-DD
     * @param {string} timeStr - Heure au format HH:MM
     * @returns {Date} Date UTC pour stockage en base
     */
    parseDateTime(dateStr, timeStr) {
        // Créer une date avec les composants saisis comme heure française
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
        const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
        
        // Créer une date temporaire pour déterminer le décalage actuel
        const tempDate = new Date(year, month - 1, day, 12, 0, 0); // midi pour éviter les problèmes de changement d'heure
        const offsetHours = tempDate.getTimezoneOffset() / -60; // Décalage en heures
        
        // En septembre, la France est en heure d'été (UTC+2)
        const frenchOffsetHours = 2; // Pour l'heure d'été
        
        // Créer la date UTC en soustrayant le décalage français
        const utcDate = new Date(Date.UTC(year, month - 1, day, hours - frenchOffsetHours, minutes, 0));
        
        return utcDate;
    }

    /**
     * Extrait les composants date/heure d'une date UTC pour affichage en heure française
     * @param {Date|string} utcDate - Date UTC
     * @returns {Object} Composants date/heure en heure française
     */
    extractComponents(utcDate) {
        const date = utcDate instanceof Date ? utcDate : new Date(utcDate);
        
        // Ajouter le décalage français (2h en été)
        const frenchOffsetHours = 2; // Pour l'heure d'été
        const frenchDate = new Date(date.getTime() + (frenchOffsetHours * 60 * 60 * 1000));
        
        return {
            year: frenchDate.getUTCFullYear(),
            month: frenchDate.getUTCMonth() + 1,
            day: frenchDate.getUTCDate(),
            hours: frenchDate.getUTCHours(),
            minutes: frenchDate.getUTCMinutes(),
            seconds: frenchDate.getUTCSeconds(),
            formattedDate: `${frenchDate.getUTCFullYear()}-${String(frenchDate.getUTCMonth() + 1).padStart(2, '0')}-${String(frenchDate.getUTCDate()).padStart(2, '0')}`,
            formattedTime: `${String(frenchDate.getUTCHours()).padStart(2, '0')}:${String(frenchDate.getUTCMinutes()).padStart(2, '0')}`
        };
    }
}

// Export d'une instance singleton
const frenchTZ = new FrenchTimezone();
module.exports = frenchTZ;