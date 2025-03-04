/**
 * Fonctions pour la page de détails du ticket
 */

/**
 * Prévisualise l'image avant l'upload
 * @param {HTMLInputElement} input - L'élément input de type file
 */
function previewImage(input) {
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.classList.remove('hidden');
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        previewContainer.classList.add('hidden');
    }
}

/**
 * Valide le formulaire de message et active/désactive le bouton d'envoi
 */
function validateMessageForm() {
    const textarea = document.getElementById('messageContent');
    const submitButton = document.getElementById('submitMessage');
    
    if (textarea.value.trim() === '') {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        submitButton.disabled = false;
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

/**
 * Copie le lien du ticket actuel dans le presse-papier
 */
function copyTicketLink() {
    const currentUrl = window.location.href;
    const tooltip = document.getElementById('copyTooltip');
    const originalText = tooltip.textContent;
    
    // Vérifier si l'API Clipboard est disponible
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentUrl)
            .then(() => {
                tooltip.textContent = 'Lien copié !';
                setTimeout(() => {
                    tooltip.textContent = originalText;
                }, 2000);
            })
            .catch(error => {
                console.error('Erreur lors de la copie du lien:', error);
                fallbackCopyMethod(currentUrl, tooltip, originalText);
            });
    } else {
        // Méthode alternative si l'API Clipboard n'est pas disponible
        fallbackCopyMethod(currentUrl, tooltip, originalText);
    }
}

/**
 * Méthode alternative pour copier du texte dans le presse-papier
 * @param {string} text - Le texte à copier
 * @param {HTMLElement} tooltip - L'élément tooltip à mettre à jour
 * @param {string} originalText - Le texte original du tooltip
 */
function fallbackCopyMethod(text, tooltip, originalText) {
    // Créer un élément textarea temporaire
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';  // Évite de faire défiler la page
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let successful = false;
    try {
        // Exécuter la commande de copie
        successful = document.execCommand('copy');
    } catch (err) {
        console.error('Erreur lors de la copie du lien:', err);
    }
    
    // Nettoyer
    document.body.removeChild(textArea);
    
    // Mettre à jour le tooltip
    if (successful) {
        tooltip.textContent = 'Lien copié !';
    } else {
        tooltip.textContent = 'Échec de la copie';
    }
    
    setTimeout(() => {
        tooltip.textContent = originalText;
    }, 2000);
}

/**
 * Archive un ticket après confirmation
 * @param {string} id - L'identifiant du ticket à archiver
 */
function archiveTicket(id) {
    if (confirm('Voulez-vous archiver cet appel ?')) {
        fetch(`/api/tickets/${id}/archive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => window.location.href = '/');
    }
}

// Initialisation des événements
document.addEventListener('DOMContentLoaded', function() {
    // Prévisualisation d'image
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            previewImage(this);
        });
    }
    
    // Validation du formulaire de message
    const messageTextarea = document.getElementById('messageContent');
    if (messageTextarea) {
        messageTextarea.addEventListener('input', validateMessageForm);
        validateMessageForm(); // Validation initiale
    }
    
    // Bouton de copie de lien
    const copyButton = document.getElementById('copyLinkButton');
    if (copyButton) {
        copyButton.addEventListener('click', copyTicketLink);
    }
}); 