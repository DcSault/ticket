/**
 * Gestion de la version de l'application
 * Ce script permet de centraliser la version de l'application
 * et de la mettre à jour automatiquement dans tous les éléments HTML
 */

// Configuration de la version
const APP_CONFIG = {
    version: '2.0.2',
    developer: 'Sault',
    githubUrl: 'https://github.com/DcSault'
};

/**
 * Met à jour tous les éléments qui affichent la version de l'application
 */
function updateVersionElements() {
    // Mettre à jour les éléments avec la classe 'app-version'
    document.querySelectorAll('.app-version').forEach(element => {
        element.textContent = APP_CONFIG.version;
    });

    // Mettre à jour les éléments avec la classe 'app-developer'
    document.querySelectorAll('.app-developer').forEach(element => {
        element.textContent = APP_CONFIG.developer;
    });

    // Mettre à jour les liens GitHub
    document.querySelectorAll('.app-github-link').forEach(element => {
        if (element.tagName === 'A') {
            element.href = APP_CONFIG.githubUrl;
        }
    });

    // Mettre à jour les éléments qui contiennent la version dans le texte
    document.querySelectorAll('.version-badge span:not(.app-developer)').forEach(element => {
        if (element.textContent.includes('Version')) {
            element.textContent = `Version ${APP_CONFIG.version}`;
        }
    });
}

/**
 * Initialise le gestionnaire de version
 */
function initVersionManager() {
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateVersionElements);
    } else {
        updateVersionElements();
    }
}

// Exécuter l'initialisation
initVersionManager();

/**
 * Fonction pour obtenir la version actuelle
 * @returns {string} La version actuelle de l'application
 */
function getAppVersion() {
    return APP_CONFIG.version;
}

/**
 * Fonction pour obtenir le développeur
 * @returns {string} Le nom du développeur
 */
function getAppDeveloper() {
    return APP_CONFIG.developer;
}

/**
 * Fonction pour obtenir l'URL GitHub
 * @returns {string} L'URL du dépôt GitHub
 */
function getGithubUrl() {
    return APP_CONFIG.githubUrl;
} 