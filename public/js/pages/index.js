/**
 * Fonctions pour la page d'accueil
 */

// Gestion des champs GLPI
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

// Affichage/masquage des champs mémorisés
function toggleSavedFields() {
    const section = document.getElementById('savedFieldsSection');
    const icon = document.getElementById('savedFieldsIcon');
    const buttonText = document.getElementById('savedFieldsButtonText');
    
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        icon.classList.add('rotate-180');
        buttonText.textContent = 'Masquer les champs mémorisés';
    } else {
        section.classList.add('hidden');
        icon.classList.remove('rotate-180');
        buttonText.textContent = 'Afficher les champs mémorisés';
    }
}

// Archivage d'un ticket
function archiveTicket(id) {
    if (confirm('Voulez-vous archiver cet appel ?')) {
        fetch(`/api/tickets/${id}/archive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => window.location.reload());
    }
}

// Suppression d'un champ mémorisé
function deleteSavedField(field, value) {
    if (confirm(`Voulez-vous supprimer "${value}" des ${field === 'caller' ? 'appelants' : field === 'reason' ? 'raisons' : 'tags'} mémorisés ?`)) {
        // Utiliser URLSearchParams au lieu de FormData pour envoyer les données
        const data = new URLSearchParams();
        data.append('field', field);
        data.append('value', value);
        
        fetch('/api/saved-fields/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        }).then(() => window.location.reload());
    }
}

// Autocomplétion pour les champs
document.addEventListener('DOMContentLoaded', function() {
    setupAutocomplete('caller', savedFields?.callers || []);
    setupAutocomplete('reason', savedFields?.reasons || []);
    setupAutocomplete('tags', savedFields?.tags || [], true);
});

// Configuration de l'autocomplétion pour un champ
function setupAutocomplete(fieldId, suggestions, isMultiple = false) {
    const input = document.getElementById(fieldId);
    if (!input || !suggestions.length) return;
    
    // Créer la liste d'autocomplétion
    let autocompleteList = document.createElement('div');
    autocompleteList.className = 'autocomplete-list';
    autocompleteList.id = `${fieldId}-autocomplete`;
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(autocompleteList);
    
    // Événement d'entrée dans le champ
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        let currentValues = [];
        
        // Pour les champs multiples (comme les tags), on sépare par virgule
        if (isMultiple && value.includes(',')) {
            const parts = value.split(',');
            const currentValue = parts[parts.length - 1].trim().toLowerCase();
            currentValues = parts.slice(0, parts.length - 1).map(p => p.trim().toLowerCase());
            updateAutocompleteList(currentValue, suggestions.filter(s => !currentValues.includes(s.toLowerCase())));
        } else {
            updateAutocompleteList(value, suggestions);
        }
    });
    
    // Mise à jour de la liste d'autocomplétion
    function updateAutocompleteList(value, suggestions) {
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
        
        if (!value) return;
        
        const matchingSuggestions = suggestions.filter(s => 
            s.toLowerCase().includes(value)
        );
        
        if (matchingSuggestions.length > 0) {
            matchingSuggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = suggestion;
                item.addEventListener('click', function() {
                    if (isMultiple) {
                        const parts = input.value.split(',');
                        parts[parts.length - 1] = ` ${suggestion}`;
                        input.value = parts.join(',');
                        if (parts.length < suggestions.length) {
                            input.value += ', ';
                        }
                    } else {
                        input.value = suggestion;
                    }
                    autocompleteList.style.display = 'none';
                    input.focus();
                });
                autocompleteList.appendChild(item);
            });
            autocompleteList.style.display = 'block';
        }
    }
    
    // Fermer la liste quand on clique ailleurs
    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            autocompleteList.style.display = 'none';
        }
    });
} 