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

// Gestion des modales pour les choix rapides
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Récupérer les choix les plus fréquents
function getTopChoices(items, count = 4) {
    // Si aucun élément ou tableau vide, ne rien afficher
    if (!items || items.length === 0) {
        return [];
    }
    
    // Compter la fréquence de chaque élément
    const frequencyMap = {};
    items.forEach(item => {
        frequencyMap[item] = (frequencyMap[item] || 0) + 1;
    });
    
    // Convertir en tableau et trier par fréquence décroissante
    return Object.entries(frequencyMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(entry => entry[0]);
}

// Afficher les options rapides dans une modale
function renderQuickOptions(containerId, options, fieldId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // Si aucune option, afficher un message
    if (!options || options.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center text-gray-500 dark:text-gray-400 py-4';
        emptyMessage.textContent = 'Aucune option fréquemment utilisée';
        container.appendChild(emptyMessage);
        return;
    }
    
    // Définir des icônes pour les tags courants
    const tagIcons = {
        'réseau': '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>',
        'imprimante': '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>',
        'logiciel': '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>',
        'téléphonie': '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>'
    };
    
    // Définir des icônes pour les raisons courantes
    const reasonIcons = {
        'connexion': '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.143 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>',
        'imprimante': '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>',
        'logiciel': '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>',
        'accès': '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>'
    };
    
    // Icône par défaut
    const defaultIcon = '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>';
    
    // Déterminer si c'est pour les raisons ou les tags
    const isTagsField = fieldId === 'tags';
    const iconMap = isTagsField ? tagIcons : reasonIcons;
    const buttonClass = isTagsField ? 
        'bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700 text-purple-800 dark:text-purple-200' : 
        'bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200';
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `${buttonClass} py-2 px-4 rounded text-left flex items-center w-full mb-2 transition-colors`;
        
        // Trouver l'icône appropriée ou utiliser l'icône par défaut
        let icon = defaultIcon;
        const lowerOption = option.toLowerCase();
        
        Object.keys(iconMap).forEach(key => {
            if (lowerOption.includes(key.toLowerCase())) {
                icon = iconMap[key];
            }
        });
        
        button.innerHTML = `
            ${icon}
            <span class="truncate">${option}</span>
        `;
        
        button.addEventListener('click', () => {
            const input = document.getElementById(fieldId);
            if (input) {
                if (isTagsField && input.value) {
                    // Pour les tags, ajouter à la liste existante
                    const currentTags = input.value.split(',').map(tag => tag.trim());
                    if (!currentTags.includes(option)) {
                        if (input.value && !input.value.endsWith(',')) {
                            input.value += ', ';
                        }
                        input.value += option;
                    }
                } else {
                    // Pour les autres champs, remplacer la valeur
                    input.value = option;
                }
                
                // Fermer la modale
                closeModal(fieldId === 'reason' ? 'quickReasonModal' : 'quickTagsModal');
            }
        });
        
        container.appendChild(button);
    });
}

// Initialiser les boutons de choix rapide
function initQuickChoiceButtons(savedFields) {
    // S'assurer que savedFields existe
    savedFields = savedFields || { reasons: [], tags: [] };
    
    // Bouton pour les raisons
    const quickReasonBtn = document.getElementById('quickReasonBtn');
    if (quickReasonBtn) {
        quickReasonBtn.addEventListener('click', () => {
            const topReasons = getTopChoices(savedFields.reasons);
            renderQuickOptions('quickReasonOptions', topReasons, 'reason');
            openModal('quickReasonModal');
        });
    }
    
    // Bouton pour les tags
    const quickTagsBtn = document.getElementById('quickTagsBtn');
    if (quickTagsBtn) {
        quickTagsBtn.addEventListener('click', () => {
            const topTags = getTopChoices(savedFields.tags);
            renderQuickOptions('quickTagsOptions', topTags, 'tags');
            openModal('quickTagsModal');
        });
    }
}

// Autocomplétion pour les champs
document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les champs mémorisés
    fetch('/api/saved-fields')
        .then(response => response.json())
        .then(savedFields => {
            // Configurer l'autocomplétion
            setupAutocomplete('caller', savedFields.callers || []);
            setupAutocomplete('reason', savedFields.reasons || []);
            setupAutocomplete('tags', savedFields.tags || [], true);
            
            // Initialiser les boutons de choix rapide
            initQuickChoiceButtons(savedFields);
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des champs mémorisés:', error);
        });
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