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
    navigator.clipboard.writeText(currentUrl).then(() => {
        const tooltip = document.getElementById('copyTooltip');
        const originalText = tooltip.textContent;
        
        tooltip.textContent = 'Lien copié !';
        setTimeout(() => {
            tooltip.textContent = originalText;
        }, 2000);
    });
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