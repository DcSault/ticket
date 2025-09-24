/**
 * Valide le formulaire de création de ticket.
 * @param {HTMLFormElement} form - Le formulaire à valider.
 * @returns {boolean} - True si le formulaire est valide, sinon false.
 */
function validateCreationForm(form) {
    let isValid = true;
    
    // Réinitialiser les erreurs précédentes
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));

    // Validation du champ 'caller'
    const caller = form.elements['caller'];
    if (!caller.value.trim()) {
        isValid = false;
        showError(caller, 'Le nom de l\'appelant est requis.');
    }

    // Validation du champ 'reason' si ce n'est pas un ticket GLPI
    const isGLPI = form.elements['isGLPI'].checked;
    if (!isGLPI) {
        const reason = form.elements['reason'];
        if (!reason.value.trim()) {
            isValid = false;
            showError(reason, 'La raison de l\'appel est requise.');
        }
    }

    return isValid;
}


document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('createTicketForm');
    if (!form) return;

    // Initialiser la date et l'utilisateur
    form.elements['createdAt'].value = new Date().toISOString().slice(0, 16);
    fetchCurrentUser().then(user => {
        if (user) {
            form.elements['createdBy'].value = user.username;
        }
    });

    // Gérer la soumission du formulaire avec AJAX
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        if (validateCreationForm(form)) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Assurer la conversion correcte des booléens et des tags
            data.isGLPI = form.elements['isGLPI'].checked;
            data.isBlocking = form.elements['isBlocking'] ? form.elements['isBlocking'].checked : false;
            data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

            const result = await createTicket(data);

            if (result) {
                showNotification('Ticket créé avec succès !', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                // L'erreur est déjà notifiée par apiClient.js
            }
        }
    });
});