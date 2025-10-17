/**
 * Fonctions communes pour toutes les pages de l'application
 */

/**
 * Formate une date en format français avec le bon fuseau horaire
 * @param {string|Date} dateValue - La date à formater
 * @returns {string} - La date formatée
 */
function formatDate(dateValue) {
    // Si la bibliothèque moment est disponible, l'utiliser avec le fuseau horaire Europe/Paris
    if (typeof moment !== 'undefined') {
        // Créer une date moment dans le fuseau Europe/Paris
        return moment.utc(dateValue).tz('Europe/Paris').format('D MMMM YYYY, HH:mm');
    } else {
        // Fallback si moment n'est pas disponible
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris'
        });
    }
}

/**
 * Crée et affiche une notification
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de notification ('success', 'error', 'warning')
 * @param {number} duration - La durée d'affichage en millisecondes
 */
function showNotification(message, type = 'success', duration = 3000) {
    // Supprime les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Crée la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Ajoute la notification au DOM
    document.body.appendChild(notification);
    
    // Supprime la notification après la durée spécifiée
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Copie un texte dans le presse-papier
 * @param {string} text - Le texte à copier
 * @returns {Promise<boolean>} - True si la copie a réussi, sinon False
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copié dans le presse-papier !');
        return true;
    } catch (err) {
        console.error('Erreur lors de la copie :', err);
        return false;
    }
}

/**
 * Ajoute un écouteur d'événement avec délai
 * @param {HTMLElement} element - L'élément sur lequel ajouter l'écouteur
 * @param {string} eventType - Le type d'événement
 * @param {Function} callback - La fonction de rappel
 * @param {number} delay - Le délai en millisecondes
 */
function addDelayedEventListener(element, eventType, callback, delay = 300) {
    let timeoutId;
    
    element.addEventListener(eventType, function(event) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(event), delay);
    });
}

/**
 * Valide un formulaire HTML5
 * @param {HTMLFormElement} form - Le formulaire à valider
 * @returns {boolean} - True si le formulaire est valide, sinon False
 */
function validateForm(form) {
    // Supprime les messages d'erreur existants
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    // Vérifie la validité des champs
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            showInputError(input, 'Ce champ est requis');
        } else if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
            isValid = false;
            showInputError(input, 'Email invalide');
        }
    });
    
    return isValid;
}

/**
 * Affiche un message d'erreur sous un champ de formulaire
 * @param {HTMLElement} input - Le champ de formulaire
 * @param {string} message - Le message d'erreur à afficher
 */
function showInputError(input, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Ajoute le message après l'input
    input.parentNode.appendChild(errorElement);
    
    // Met en évidence le champ en erreur
    input.classList.add('border-red-500');
    
    // Supprime l'erreur lors de la modification du champ
    input.addEventListener('input', function() {
        input.classList.remove('border-red-500');
        const error = input.parentNode.querySelector('.error-message');
        if (error) error.remove();
    }, { once: true });
}

/**
 * Vérifie si une adresse email est valide
 * @param {string} email - L'adresse email à vérifier
 * @returns {boolean} - True si l'email est valide, sinon False
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Applique les classes CSS communes aux éléments de l'interface
 */
function applyCommonStyles() {
    // Ajoute la classe form-input aux champs de formulaire
    const formInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="date"], textarea, select');
    formInputs.forEach(input => input.classList.add('form-input'));
    
    // Ajoute la classe btn aux boutons
    const buttons = document.querySelectorAll('button:not([type="reset"]), a.bg-blue-500, a.bg-gray-500, a.bg-green-500, a.bg-red-500, a.bg-yellow-500');
    buttons.forEach(button => button.classList.add('btn'));
    
    // Ajoute la classe card aux conteneurs de carte
    const cards = document.querySelectorAll('.bg-white.p-6.rounded-lg.shadow-md');
    cards.forEach(card => card.classList.add('card'));
    
    // Ajoute la classe tag aux tags
    const tags = document.querySelectorAll('.bg-gray-200.px-2.py-1.rounded.text-sm');
    tags.forEach(tag => tag.classList.add('tag'));
}

// Initialisation des styles communs au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    applyCommonStyles();
}); 