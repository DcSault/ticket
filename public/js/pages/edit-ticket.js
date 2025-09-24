/**
 * Gère l'affichage des champs non-GLPI en fonction de l'état de la case à cocher
 * @param {HTMLInputElement} checkbox - La case à cocher GLPI
 */
// toggleGLPIFields est fourni par /js/ticketFunctions.js

/**
 * Valide le formulaire avant soumission
 * @returns {boolean} - True si le formulaire est valide, sinon False
 */
function validateForm() {
    let isValid = true;
    const errorMessages = document.querySelectorAll('.error-message');
    
    // Supprime les messages d'erreur existants
    errorMessages.forEach(msg => msg.remove());
    
    // Vérifie que l'appelant est renseigné
    const callerInput = document.querySelector('input[name="caller"]');
    if (!callerInput.value.trim()) {
        isValid = false;
        showError(callerInput, 'L\'appelant est requis');
    }
    
    // Vérifie les champs non-GLPI si nécessaire
    const isGLPI = document.getElementById('isGLPI').checked;
    if (!isGLPI) {
        const reasonInput = document.querySelector('input[name="reason"]');
        if (!reasonInput.value.trim()) {
            isValid = false;
            showError(reasonInput, 'La raison est requise');
        }
    }
    
    return isValid;
}

/**
 * Affiche un message d'erreur sous un champ de formulaire
 * @param {HTMLElement} input - Le champ de formulaire
 * @param {string} message - Le message d'erreur à afficher
 */
function showError(input, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    input.parentNode.appendChild(errorElement);
    
    // Met en évidence le champ en erreur
    input.classList.add('border-red-500');
    input.addEventListener('input', function() {
        input.classList.remove('border-red-500');
        const error = input.parentNode.querySelector('.error-message');
        if (error) error.remove();
    }, { once: true });
}

// Initialisation des événements
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editTicketForm');
    if (!form) return;

    // Charger les données du ticket et remplir le formulaire
    const ticketId = window.location.pathname.split('/')[2];
    if (ticketId) {
        fetchTicketDetails(ticketId).then(ticket => {
            if (ticket) {
                form.elements['caller'].value = ticket.caller || '';
                form.elements['isGLPI'].checked = ticket.isGLPI;
                form.elements['isBlocking'].checked = ticket.isBlocking;
                form.elements['glpiNumber'].value = ticket.glpiNumber || '';
                form.elements['reason'].value = ticket.reason || '';
                form.elements['tags'].value = ticket.tags ? ticket.tags.join(', ') : '';

                // Remplir les champs de date et d'heure
                const createdAt = new Date(ticket.createdAt);
                form.elements['creationDate'].value = createdAt.toISOString().split('T')[0];
                form.elements['creationTime'].value = createdAt.toTimeString().split(' ')[0].substring(0, 5);
                
                // Gérer l'affichage des champs GLPI
                toggleGLPIFields(form.elements['isGLPI']);
            }
        });
    }

    // Gérer la soumission du formulaire avec AJAX
    form.addEventListener('submit', async function(e) {
        e.preventDefault(); // Toujours empêcher la soumission par défaut

        if (validateForm()) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // S'assurer que les booléens sont bien envoyés
            data.isGLPI = form.elements['isGLPI'].checked;
            data.isBlocking = form.elements['isBlocking'].checked;

            const result = await updateTicket(ticketId, data);

            if (result && result.success) {
                showNotification('Ticket mis à jour avec succès !', 'success');
                setTimeout(() => {
                    window.location.href = '/'; // Rediriger après la mise à jour
                }, 1000);
            } else {
                showNotification('Erreur lors de la mise à jour du ticket.', 'error');
            }
        }
    });
});