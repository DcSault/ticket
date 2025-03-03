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
    // Ajoute la classe form-input à tous les champs de saisie
    const inputs = document.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => input.classList.add('form-input'));
    
    // Ajoute la classe btn aux boutons
    const buttons = document.querySelectorAll('button, a.bg-gray-500, a.bg-blue-500');
    buttons.forEach(button => button.classList.add('btn'));
    
    // Ajoute la validation au formulaire
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validateForm()) {
                e.preventDefault();
            }
        });
    }
}); 