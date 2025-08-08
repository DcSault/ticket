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
                    input.value = terms.join(', ');
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
// validateForm est disponible dans /js/common.js

/**
 * Affiche un message d'erreur sous un champ de formulaire
 * @param {HTMLElement} input - Le champ de formulaire
 * @param {string} message - Le message d'erreur à afficher
 */
// showInputError est disponible dans /js/common.js

/**
 * Vérifie si une adresse email est valide
 * @param {string} email - L'adresse email à vérifier
 * @returns {boolean} - True si l'email est valide, sinon False
 */
// isValidEmail est disponible dans /js/common.js

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