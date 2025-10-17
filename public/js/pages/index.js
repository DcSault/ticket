/**
 * Fonctions pour la page d'accueil
 */

// Gestion des champs GLPI
// toggleGLPIFields est fourni par /js/ticketFunctions.js

// Affichage/masquage des champs mémorisés
// toggleSavedFields est fourni par /js/ticketFunctions.js

// Archivage d'un ticket
// archiveTicket est fourni par /js/ticketFunctions.js

// Suppression d'un champ mémorisé
// deleteSavedField est fourni par /js/ticketFunctions.js

// Variables globales pour stocker les statistiques d'utilisation
let usageStats = {
    reasons: {},
    tags: {},
    reasonToTags: {}, // Pour les associations raison -> tags
    tagToReasons: {}  // Pour les associations tag -> raisons
};

// Récupérer les archives des tickets pour analyser les usages
async function fetchArchiveStats() {
    try {
        const response = await fetch('/api/archives');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des archives');
        }
        
        const archives = await response.json();
        analyzeArchives(archives);
        
        return usageStats;
    } catch (error) {
        console.error('Erreur lors de l\'analyse des archives:', error);
        return usageStats;
    }
}

// Analyser les archives pour déterminer les statistiques d'utilisation
function analyzeArchives(archives) {
    // Réinitialiser les statistiques
    usageStats = {
        reasons: {},
        tags: {},
        reasonToTags: {},
        tagToReasons: {}
    };
    
    // Parcourir toutes les archives
    archives.forEach(ticket => {
        // Ne traiter que les tickets non-GLPI qui ont des raisons et des tags
        if (!ticket.isGLPI && ticket.reason) {
            // Compter les raisons
            usageStats.reasons[ticket.reason] = (usageStats.reasons[ticket.reason] || 0) + 1;
            
            // Traiter les tags
            let tags = [];
            if (Array.isArray(ticket.tags)) {
                tags = ticket.tags;
            } else if (typeof ticket.tags === 'string') {
                tags = ticket.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
            
            // Compter les tags
            tags.forEach(tag => {
                usageStats.tags[tag] = (usageStats.tags[tag] || 0) + 1;
                
                // Associer raison -> tags
                if (!usageStats.reasonToTags[ticket.reason]) {
                    usageStats.reasonToTags[ticket.reason] = {};
                }
                usageStats.reasonToTags[ticket.reason][tag] = (usageStats.reasonToTags[ticket.reason][tag] || 0) + 1;
                
                // Associer tag -> raisons
                if (!usageStats.tagToReasons[tag]) {
                    usageStats.tagToReasons[tag] = {};
                }
                usageStats.tagToReasons[tag][ticket.reason] = (usageStats.tagToReasons[tag][ticket.reason] || 0) + 1;
            });
        }
    });
    
    console.log('Statistiques d\'utilisation calculées:', usageStats);
}

// Récupérer les choix les plus fréquents
function getTopChoices(items, count = 4) {
    // Si aucun élément ou tableau vide, ne rien afficher
    if (!items || Object.keys(items).length === 0) {
        return [];
    }
    
    // Convertir en tableau et trier par fréquence décroissante
    return Object.entries(items)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(entry => entry[0]);
}

// Récupérer les tags associés à une raison
function getTagsForReason(reason, count = 4) {
    if (!usageStats.reasonToTags[reason]) {
        return [];
    }
    
    return getTopChoices(usageStats.reasonToTags[reason], count);
}

// Récupérer les raisons associées à un tag
function getReasonsForTag(tag, count = 4) {
    if (!usageStats.tagToReasons[tag]) {
        return [];
    }
    
    return getTopChoices(usageStats.tagToReasons[tag], count);
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

// Afficher les options rapides dans une modale
function renderQuickOptions(containerId, options, fieldId, sourceValue = null) {
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
    
    // Ajouter un titre si on affiche des suggestions basées sur une sélection précédente
    if (sourceValue) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'mb-3 text-sm text-gray-600 dark:text-gray-400';
        titleDiv.textContent = isTagsField 
            ? `Tags fréquemment utilisés avec "${sourceValue}"` 
            : `Raisons fréquemment utilisées avec "${sourceValue}"`;
        container.appendChild(titleDiv);
    }
    
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
                
                // Fermer la modale actuelle
                closeModal(isTagsField ? 'quickTagsModal' : 'quickReasonModal');
                
                // Si c'est une raison, ouvrir automatiquement les tags associés
                if (!isTagsField) {
                    const associatedTags = getTagsForReason(option);
                    if (associatedTags.length > 0) {
                        setTimeout(() => {
                            renderQuickOptions('quickTagsOptions', associatedTags, 'tags', option);
                            openModal('quickTagsModal');
                        }, 300);
                    }
                } 
                // Si c'est un tag, ouvrir automatiquement les raisons associées
                else if (sourceValue === null) { // Seulement si ce n'est pas déjà une suggestion basée sur une raison
                    const associatedReasons = getReasonsForTag(option);
                    if (associatedReasons.length > 0) {
                        setTimeout(() => {
                            renderQuickOptions('quickReasonOptions', associatedReasons, 'reason', option);
                            openModal('quickReasonModal');
                        }, 300);
                    }
                }
            }
        });
        
        container.appendChild(button);
    });
}

// Initialiser les boutons de choix rapide
async function initQuickChoiceButtons() {
    // Récupérer les statistiques d'utilisation depuis les archives
    await fetchArchiveStats();
    
    // Bouton pour les raisons
    const quickReasonBtn = document.getElementById('quickReasonBtn');
    if (quickReasonBtn) {
        quickReasonBtn.addEventListener('click', () => {
            const topReasons = getTopChoices(usageStats.reasons);
            renderQuickOptions('quickReasonOptions', topReasons, 'reason');
            openModal('quickReasonModal');
        });
    }
    
    // Bouton pour les tags
    const quickTagsBtn = document.getElementById('quickTagsBtn');
    if (quickTagsBtn) {
        quickTagsBtn.addEventListener('click', () => {
            const topTags = getTopChoices(usageStats.tags);
            renderQuickOptions('quickTagsOptions', topTags, 'tags');
            openModal('quickTagsModal');
        });
    }
}

// Charger et afficher les tickets actifs
async function loadTickets() {
    try {
        const data = await fetchActiveTickets();
        
        // Gérer la nouvelle structure avec pagination
        const tickets = data.tickets || data;
        
        displayTickets(tickets);
    } catch (error) {
        console.error('Erreur lors du chargement des tickets:', error);
        const container = document.getElementById('ticketsContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-red-500 dark:text-red-400 text-center py-8">
                    <p class="mb-2">❌ Erreur lors du chargement des tickets</p>
                    <button onclick="loadTickets()" class="text-sm underline">Réessayer</button>
                </div>
            `;
        }
    }
}

// Afficher les tickets dans le container
function displayTickets(tickets) {
    const container = document.getElementById('ticketsContainer');
    if (!container) return;
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = `
            <div class="text-gray-500 dark:text-gray-400 text-center py-8">
                ✨ Aucun ticket actif
            </div>
        `;
        return;
    }
    
    container.innerHTML = tickets.map(ticket => {
        const tagsHTML = ticket.tags && ticket.tags.length > 0 ? `
            <div class="flex flex-wrap gap-2 mt-2">
                ${ticket.tags.map(tag => `
                    <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                        ${tag}
                    </span>
                `).join('')}
            </div>
        ` : '';
        
        return `
            <div class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <div class="flex justify-between items-start gap-4">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            ${ticket.caller}
                            ${ticket.isBlocking ? '<span class="text-red-500 text-xl" title="Bloquant">🔴</span>' : ''}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400 mt-1">
                            ${ticket.isGLPI ? `<strong>GLPI #${ticket.glpiNumber}</strong>` : ticket.reason || 'Aucune raison spécifiée'}
                        </p>
                        ${tagsHTML}
                        <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Créé ${formatDate(ticket.createdAt)} par ${ticket.createdBy}
                        </p>
                    </div>
                    <div class="flex flex-col gap-2 flex-shrink-0">
                        <a href="/ticket/${ticket.id}" 
                           class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-center whitespace-nowrap transition-colors">
                            📄 Voir
                        </a>
                        <button onclick="archiveTicket('${ticket.id}'); return false;" 
                                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded whitespace-nowrap transition-colors">
                            ✅ Archiver
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Autocomplétion pour les champs
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initialisation de la page d\'accueil...');
    
    // 1. Initialiser les styles de formulaire
    if (typeof initFormStyles === 'function') {
        initFormStyles();
    }
    
    // 2. Charger les données utilisateur
    try {
        const userData = await fetchCurrentUser();
        if (userData && userData.username) {
            const usernameEl = document.getElementById('username');
            if (usernameEl) {
                usernameEl.textContent = userData.username;
            }
        }
    } catch (error) {
        console.error('Erreur chargement user:', error);
    }
    
    // 3. Charger les champs mémorisés
    let savedFields = { callers: [], reasons: [], tags: [] };
    try {
        savedFields = await fetchSavedFields();
        console.log('📝 Champs mémorisés chargés:', savedFields);
        
        // Afficher les champs mémorisés
        if (typeof renderSavedFields === 'function') {
            renderSavedFields(savedFields);
        }
    } catch (error) {
        console.error('Erreur chargement saved fields:', error);
    }
    
    // 4. Configurer l'autocomplétion
    if (typeof setupAutocomplete === 'function') {
        setupAutocomplete('caller', savedFields.callers || []);
        setupAutocomplete('reason', savedFields.reasons || []);
        setupAutocomplete('tags', savedFields.tags || [], true);
        console.log('✅ Autocomplétion configurée');
    }
    
    // 5. Initialiser les boutons de choix rapide
    initQuickChoiceButtons();
    
    // 6. Charger les tickets actifs
    await loadTickets();
    
    // 7. Gérer la soumission du formulaire
    const ticketForm = document.getElementById('ticketForm');
    if (ticketForm) {
        ticketForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(ticketForm);
            const ticketData = {
                caller: formData.get('caller'),
                reason: formData.get('reason') || '',
                tags: formData.get('tags') || '',
                isGLPI: formData.get('isGLPI') === 'true' || formData.get('isGLPI') === 'on',
                glpiNumber: formData.get('glpiNumber') || '',
                isBlocking: formData.get('isBlocking') === 'true' || formData.get('isBlocking') === 'on'
            };
            
            try {
                showNotification('Création du ticket...', 'info');
                const result = await createTicket(ticketData);
                
                if (result && result.success) {
                    showNotification('✅ Ticket créé avec succès !', 'success');
                    
                    // Réinitialiser le formulaire
                    ticketForm.reset();
                    
                    // Recharger les tickets
                    await loadTickets();
                    
                    // Recharger les champs mémorisés
                    try {
                        const newSavedFields = await fetchSavedFields();
                        if (typeof renderSavedFields === 'function') {
                            renderSavedFields(newSavedFields);
                        }
                    } catch (error) {
                        console.error('Erreur rechargement saved fields:', error);
                    }
                }
            } catch (error) {
                console.error('Erreur création ticket:', error);
                showNotification('❌ Erreur lors de la création du ticket', 'error');
            }
        });
    }
    
    console.log('✅ Page d\'accueil initialisée avec succès');
});

// ✅ La fonction setupAutocomplete() est maintenant dans formFunctions.js
// Plus besoin de la redéfinir ici
 