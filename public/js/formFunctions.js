/**
 * Fonctions communes pour la gestion des formulaires
 */

/**
 * Configure l'autocomplétion pour un champ de saisie
 * @param {string} fieldId - ID du champ de saisie
 * @param {Array} suggestions - Liste des suggestions
 * @param {boolean} isMultiple - Si le champ accepte plusieurs valeurs séparées par des virgules
 */
function setupAutocomplete(fieldId, suggestions, isMultiple = false) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    
    // Créer un conteneur pour la liste d'autocomplétion
    let listContainer = document.createElement('div');
    listContainer.className = 'autocomplete-list';
    listContainer.id = `${fieldId}-autocomplete`;
    input.parentNode.appendChild(listContainer);
    
    // Fonction pour mettre à jour la liste d'autocomplétion
    function updateAutocompleteList(value, suggestions) {
        // Vider la liste
        listContainer.innerHTML = '';
        listContainer.classList.remove('show');
        
        if (!value) return;
        
        // Filtrer les suggestions
        const terms = isMultiple ? value.split(',').map(t => t.trim()).filter(t => t) : [value];
        const currentTerm = terms[terms.length - 1].toLowerCase();
        
        if (!currentTerm) return;
        
        const matches = suggestions.filter(item => 
            item.toLowerCase().includes(currentTerm) && 
            !terms.slice(0, -1).includes(item)
        );
        
        if (matches.length === 0) return;
        
        // Afficher les suggestions
        listContainer.classList.add('show');
        matches.forEach(match => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = match;
            item.addEventListener('click', () => {
                if (isMultiple) {
                    const terms = input.value.split(',').map(t => t.trim()).filter(t => t);
                    terms.pop();
                    terms.push(match);
                    input.value = terms.join(', ') + (terms.length > 0 ? ', ' : '');
                } else {
                    input.value = match;
                }
                listContainer.innerHTML = '';
                listContainer.classList.remove('show');
                input.focus();
            });
            listContainer.appendChild(item);
        });
    }
    
    // Événements pour l'input
    input.addEventListener('input', () => {
        updateAutocompleteList(input.value, suggestions);
    });
    
    input.addEventListener('focus', () => {
        updateAutocompleteList(input.value, suggestions);
    });
    
    input.addEventListener('blur', () => {
        // Délai pour permettre le clic sur un élément de la liste
        setTimeout(() => {
            listContainer.classList.remove('show');
        }, 200);
    });
    
    // Navigation au clavier
    input.addEventListener('keydown', (e) => {
        const items = listContainer.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;
        
        const active = listContainer.querySelector('.autocomplete-item.selected');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!active) {
                items[0].classList.add('selected');
            } else {
                active.classList.remove('selected');
                const next = active.nextElementSibling || items[0];
                next.classList.add('selected');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!active) {
                items[items.length - 1].classList.add('selected');
            } else {
                active.classList.remove('selected');
                const prev = active.previousElementSibling || items[items.length - 1];
                prev.classList.add('selected');
            }
        } else if (e.key === 'Enter' && active) {
            e.preventDefault();
            if (isMultiple) {
                const terms = input.value.split(',').map(t => t.trim()).filter(t => t);
                terms.pop();
                terms.push(active.textContent);
                input.value = terms.join(', ') + (terms.length > 0 ? ', ' : '');
            } else {
                input.value = active.textContent;
            }
            listContainer.innerHTML = '';
            listContainer.classList.remove('show');
        } else if (e.key === 'Escape') {
            listContainer.classList.remove('show');
        }
    });
}

/**
 * Valide un formulaire et affiche les erreurs
 * @param {HTMLFormElement} form - Le formulaire à valider
 * @param {Object} fields - Configuration des champs à valider (ex: {name: {required: true}})
 * @returns {boolean} - True si le formulaire est valide, sinon False
 */
function validateForm(form, fields = {}) {
    // Supprime les messages d'erreur existants
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    // Réinitialise les styles d'erreur
    form.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
    });
    
    let isValid = true;
    
    // Si aucun champ spécifié, valide tous les champs requis
    if (Object.keys(fields).length === 0) {
        const requiredInputs = form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                showInputError(input, 'Ce champ est requis');
            }
        });
        return isValid;
    }
    
    // Validation des champs spécifiés
    for (const fieldName in fields) {
        const config = fields[fieldName];
        const input = form.querySelector(`[name="${fieldName}"]`);
        
        if (!input) continue;
        
        // Validation de champ requis
        if (config.required && !input.value.trim()) {
            isValid = false;
            showInputError(input, config.message || 'Ce champ est requis');
        }
        
        // Validation d'email
        if (config.email && input.value.trim() && !isValidEmail(input.value)) {
            isValid = false;
            showInputError(input, config.message || 'Email invalide');
        }
        
        // Validation de longueur minimale
        if (config.minLength && input.value.length < config.minLength) {
            isValid = false;
            showInputError(input, config.message || `Minimum ${config.minLength} caractères`);
        }
        
        // Validation personnalisée
        if (config.validator && typeof config.validator === 'function') {
            const validatorResult = config.validator(input.value);
            if (validatorResult !== true) {
                isValid = false;
                showInputError(input, validatorResult || config.message || 'Valeur invalide');
            }
        }
    }
    
    return isValid;
}

/**
 * Affiche un message d'erreur sous un champ de formulaire
 * @param {HTMLElement} input - Le champ de formulaire
 * @param {string} message - Le message d'erreur à afficher
 */
function showInputError(input, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message text-red-500 text-sm mt-1';
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
 * Initialise les styles communs pour les formulaires
 * @param {HTMLElement} container - Le conteneur des éléments à styliser (par défaut: document)
 */
function initFormStyles(container = document) {
    // Ajoute la classe form-input aux champs de formulaire
    const formInputs = container.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="date"], textarea, select');
    formInputs.forEach(input => {
        if (!input.classList.contains('form-input')) {
            input.classList.add('form-input');
        }
    });
    
    // Ajoute la classe btn aux boutons
    const buttons = container.querySelectorAll('button:not([type="reset"]), a.bg-blue-500, a.bg-gray-500, a.bg-green-500, a.bg-red-500, a.bg-yellow-500');
    buttons.forEach(button => {
        if (!button.classList.contains('btn')) {
            button.classList.add('btn');
        }
    });
} 