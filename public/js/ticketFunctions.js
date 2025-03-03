/**
 * Fonctions communes pour la gestion des tickets
 */

/**
 * Gère l'affichage des champs non-GLPI en fonction de l'état de la case à cocher
 * @param {HTMLInputElement} checkbox - La case à cocher GLPI
 */
function toggleGLPIFields(checkbox) {
    const nonGLPIFields = document.querySelectorAll('.non-glpi-field');
    nonGLPIFields.forEach(field => {
        const inputs = field.querySelectorAll('input');
        if (checkbox.checked) {
            field.style.display = 'none';
            inputs.forEach(input => input.required = false);
        } else {
            field.style.display = 'block';
            inputs.forEach(input => input.required = true);
        }
    });
}

/**
 * Archive un ticket après confirmation
 * @param {string} id - L'identifiant du ticket à archiver
 * @param {string} redirectUrl - URL de redirection après archivage (optionnel)
 */
function archiveTicket(id, redirectUrl = '/') {
    if (confirm('Voulez-vous archiver cet appel ?')) {
        fetch(`/api/tickets/${id}/archive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = redirectUrl;
            } else {
                throw new Error('Erreur lors de l\'archivage du ticket');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur lors de l\'archivage du ticket', 'error');
        });
    }
}

/**
 * Prévisualise l'image avant l'upload
 * @param {HTMLInputElement} input - L'élément input de type file
 * @param {string} previewContainerId - ID du conteneur de prévisualisation
 * @param {string} imagePreviewId - ID de l'image de prévisualisation
 */
function previewImage(input, previewContainerId = 'previewContainer', imagePreviewId = 'imagePreview') {
    const previewContainer = document.getElementById(previewContainerId);
    const imagePreview = document.getElementById(imagePreviewId);
    
    if (!previewContainer || !imagePreview) return;
    
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
 * Copie le lien du ticket actuel dans le presse-papier
 * @param {string} tooltipId - ID de l'élément tooltip à mettre à jour
 */
function copyTicketLink(tooltipId = 'copyTooltip') {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
        .then(() => {
            const tooltip = document.getElementById(tooltipId);
            if (tooltip) {
                const originalText = tooltip.textContent;
                tooltip.textContent = 'Lien copié !';
                setTimeout(() => {
                    tooltip.textContent = originalText;
                }, 2000);
            } else {
                showNotification('Lien copié !', 'success');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la copie du lien:', error);
            showNotification('Erreur lors de la copie du lien', 'error');
        });
}

/**
 * Affiche/masque les champs mémorisés
 * @param {string} sectionId - ID de la section à afficher/masquer
 * @param {string} iconId - ID de l'icône à pivoter
 * @param {string} buttonTextId - ID du texte du bouton à modifier
 */
function toggleSavedFields(sectionId = 'savedFieldsSection', iconId = 'savedFieldsIcon', buttonTextId = 'savedFieldsButtonText') {
    const section = document.getElementById(sectionId);
    const icon = document.getElementById(iconId);
    const buttonText = document.getElementById(buttonTextId);
    
    if (!section) return;
    
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
        if (buttonText) buttonText.textContent = 'Masquer les champs mémorisés';
    } else {
        section.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
        if (buttonText) buttonText.textContent = 'Afficher les champs mémorisés';
    }
}

/**
 * Supprime un champ mémorisé
 * @param {string} field - Type de champ (caller, reason, tag)
 * @param {string} value - Valeur à supprimer
 */
function deleteSavedField(field, value) {
    const fieldLabels = {
        'caller': 'appelants',
        'reason': 'raisons',
        'tag': 'tags'
    };
    
    if (confirm(`Voulez-vous supprimer "${value}" des ${fieldLabels[field] || field} mémorisés ?`)) {
        const data = new URLSearchParams();
        data.append('field', field);
        data.append('value', value);
        
        fetch('/api/saved-fields/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        })
        .then(response => {
            if (response.ok) {
                window.location.reload();
            } else {
                throw new Error('Erreur lors de la suppression du champ');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la suppression du champ', 'error');
        });
    }
} 