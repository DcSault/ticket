/**
 * Fonctions communes pour l'interface utilisateur
 */

/**
 * Affiche les tickets actifs dans un conteneur
 * @param {Array|Object} ticketsData - Liste des tickets à afficher ou objet {tickets: [], pagination: {}}
 * @param {string} containerId - ID du conteneur où afficher les tickets
 */
function renderActiveTickets(ticketsData, containerId = 'ticketsContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // ✅ Gère les deux formats: Array ou {tickets: [], pagination: {}}
    const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData.tickets || []);
    
    if (!tickets || tickets.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-gray-600 dark:text-gray-400';
        emptyDiv.textContent = 'Aucun appel actif';
        container.appendChild(emptyDiv);
        return;
    }
    
    tickets.forEach(ticket => {
        const ticketDiv = document.createElement('div');
        ticketDiv.className = `border rounded-lg p-4 border-gray-200 dark:border-gray-700 
            ${ticket.isBlocking ? 'bg-red-50 dark:bg-red-900/20' : ''} 
            ${ticket.isGLPI ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`;
        
        let tagsHtml = '';
        if (!ticket.isGLPI && ticket.tags) {
            let tagsList = [];
            if (Array.isArray(ticket.tags)) {
                tagsList = ticket.tags;
            } else if (typeof ticket.tags === 'string') {
                tagsList = ticket.tags.split(',').map(tag => tag.trim());
            }
            
            if (tagsList.length > 0) {
                tagsHtml = '<div class="mt-1 flex flex-wrap gap-1">';
                tagsList.forEach(tag => {
                    tagsHtml += `
                        <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                            ${tag}
                        </span>
                    `;
                });
                tagsHtml += '</div>';
            }
        }
        
        ticketDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">
                        ${ticket.isGLPI ? 
                            `GLPI ${ticket.glpiNumber || ''}` : 
                            ticket.reason}
                        ${ticket.isBlocking ? '<span class="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">Bloquant</span>' : ''}
                    </h3>
                    
                    <div class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        Appelant: <span class="font-medium">${ticket.caller}</span>
                    </div>
                    
                    ${tagsHtml}
                    
                    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Créé le ${formatDate(ticket.createdAt)} par ${ticket.createdBy}
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <a href="/ticket/${ticket.id}" 
                       class="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 rounded-md text-sm font-medium transition-colors">
                        Voir
                    </a>
                    <a href="/ticket/${ticket.id}/edit" 
                       class="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700 rounded-md text-sm font-medium transition-colors">
                        Modifier
                    </a>
                    <button onclick="deleteTicket('${ticket.id}', '/')"
                            class="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 rounded-md text-sm font-medium transition-colors">
                        Supprimer
                    </button>
                    <button onclick="archiveTicket('${ticket.id}')"
                            class="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors">
                        Archiver
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(ticketDiv);
    });
}

/**
 * Affiche les tickets archivés dans un conteneur
 * @param {Array} archives - Liste des tickets archivés à afficher
 * @param {string} containerId - ID du conteneur où afficher les tickets
 */
function renderArchivedTickets(archives, containerId = 'archivesContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!archives || archives.length === 0) {
        container.innerHTML = 
            '<div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">Aucune archive trouvée.</div>';
        return;
    }
    
    archives.forEach(ticket => {
        const ticketDiv = document.createElement('div');
        ticketDiv.className = 'bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-4';
        
        let tagsHtml = '';
        if (!ticket.isGLPI && ticket.tags && ticket.tags.length > 0) {
            tagsHtml = '<div class="flex flex-wrap gap-2 mt-2">';
            ticket.tags.forEach(tag => {
                tagsHtml += `
                    <span class="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300">
                        ${tag}
                    </span>
                `;
            });
            tagsHtml += '</div>';
        }
        
        let modifiedHtml = '';
        if (ticket.lastModifiedBy) {
            modifiedHtml = `
                <br>
                Modifié le ${formatDate(ticket.lastModifiedAt)}
                par ${ticket.lastModifiedBy}
            `;
        }
        
        ticketDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2">
                        <h3 class="font-semibold text-gray-900 dark:text-white">${ticket.caller}</h3>
                        ${ticket.isGLPI ? '<span class="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-1 rounded">GLPI</span>' : ''}
                    </div>
                    ${!ticket.isGLPI ? `<p class="text-gray-600 dark:text-gray-300">${ticket.reason}</p>${tagsHtml}` : ''}
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Créé le ${formatDate(ticket.createdAt)}
                        par ${ticket.createdBy}
                        ${modifiedHtml}
                    </p>
                </div>
                ${!ticket.isGLPI ? `
                    <button onclick="showTicketDetails('${ticket.id}')"
                            class="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 rounded-md text-sm font-medium transition-colors">
                        Détails
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(ticketDiv);
    });
}

/**
 * Affiche les détails d'un ticket
 * @param {Object} ticket - Ticket à afficher
 * @param {string} containerId - ID du conteneur où afficher les détails
 */
function renderTicketDetails(ticket, containerId = 'ticketDetails') {
    const container = document.getElementById(containerId);
    if (!container || !ticket) return;
    
    let tagsHtml = '';
    if (ticket.tags && ticket.tags.length > 0) {
        tagsHtml = '<div class="flex flex-wrap gap-2 mb-4">';
        ticket.tags.forEach(tag => {
            tagsHtml += `
                <span class="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-sm tag">
                    ${tag}
                </span>
            `;
        });
        tagsHtml += '</div>';
    }
    
    let modifiedHtml = '';
    if (ticket.lastModifiedBy) {
        modifiedHtml = `
            <br>
            Modifié le ${formatDate(ticket.lastModifiedAt)}
            par ${ticket.lastModifiedBy}
        `;
    }
    
    container.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h1 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    Ticket de ${ticket.caller}
                </h1>
                <p class="text-gray-600 dark:text-gray-300 mb-4">${ticket.reason}</p>
                ${tagsHtml}
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Créé le ${formatDate(ticket.createdAt)}
                    par ${ticket.createdBy}
                    ${modifiedHtml}
                </p>
            </div>
            <div class="flex gap-2">
                <a href="/ticket/${ticket.id}/edit" 
                   class="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700 rounded-md text-sm font-medium transition-colors">
                    Modifier
                </a>
                <button onclick="deleteTicket('${ticket.id}', '/')"
                        class="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 rounded-md text-sm font-medium transition-colors">
                    Supprimer
                </button>
                <button onclick="archiveTicket('${ticket.id}')"
                        class="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors">
                    Archiver
                </button>
            </div>
        </div>
    `;
}

/**
 * Affiche les messages d'un ticket
 * @param {Array} messages - Liste des messages à afficher
 * @param {string} containerId - ID du conteneur où afficher les messages
 */
function renderMessages(messages, containerId = 'messagesContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!messages || messages.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Aucun message pour ce ticket.</p>';
        return;
    }
    
    container.innerHTML = '';
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'border-b border-gray-200 dark:border-gray-600 pb-4 mb-4 message';
        
        let contentHtml = '';
        if (message.type === 'text') {
            contentHtml = `<p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">${message.content}</p>`;
        } else {
            contentHtml = `<img src="${message.content}" alt="Image" class="max-w-md rounded shadow message-image">`;
        }
        
        messageDiv.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="font-medium text-gray-900 dark:text-white">${message.author}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                    ${formatDate(message.createdAt)}
                </span>
            </div>
            ${contentHtml}
        `;
        
        container.appendChild(messageDiv);
    });
}

/**
 * Affiche les champs mémorisés (appelants, raisons, tags)
 * @param {Object} savedFields - Objet contenant les champs mémorisés
 * @param {string} containerId - ID du conteneur où afficher les champs
 */
function renderSavedFields(savedFields, containerId = 'savedFieldsSection') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // Appelants mémorisés
    if (savedFields.callers && savedFields.callers.length > 0) {
        const callersDiv = document.createElement('div');
        callersDiv.className = 'bg-gray-50 dark:bg-gray-700 p-3 rounded';
        callersDiv.innerHTML = `
            <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Appelants mémorisés</h4>
            <div class="flex flex-wrap gap-2" id="savedCallersContainer"></div>
        `;
        container.appendChild(callersDiv);
        
        const callersContainer = callersDiv.querySelector('#savedCallersContainer');
        savedFields.callers.forEach(caller => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800';
            button.innerHTML = `
                ${caller}
                <span class="ml-1 text-red-500 hover:text-red-700" onclick="event.stopPropagation(); deleteSavedField('caller', '${caller}')">×</span>
            `;
            button.onclick = () => document.getElementById('caller').value = caller;
            callersContainer.appendChild(button);
        });
    }
    
    // Raisons mémorisées
    if (savedFields.reasons && savedFields.reasons.length > 0) {
        const reasonsDiv = document.createElement('div');
        reasonsDiv.className = 'bg-gray-50 dark:bg-gray-700 p-3 rounded';
        reasonsDiv.innerHTML = `
            <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Raisons mémorisées</h4>
            <div class="flex flex-wrap gap-2" id="savedReasonsContainer"></div>
        `;
        container.appendChild(reasonsDiv);
        
        const reasonsContainer = reasonsDiv.querySelector('#savedReasonsContainer');
        savedFields.reasons.forEach(reason => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-800';
            button.innerHTML = `
                ${reason}
                <span class="ml-1 text-red-500 hover:text-red-700" onclick="event.stopPropagation(); deleteSavedField('reason', '${reason}')">×</span>
            `;
            button.onclick = () => document.getElementById('reason').value = reason;
            reasonsContainer.appendChild(button);
        });
    }
    
    // Tags mémorisés
    if (savedFields.tags && savedFields.tags.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'bg-gray-50 dark:bg-gray-700 p-3 rounded';
        tagsDiv.innerHTML = `
            <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Tags mémorisés</h4>
            <div class="flex flex-wrap gap-2" id="savedTagsContainer"></div>
        `;
        container.appendChild(tagsDiv);
        
        const tagsContainer = tagsDiv.querySelector('#savedTagsContainer');
        savedFields.tags.forEach(tag => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-800';
            button.innerHTML = `
                ${tag}
                <span class="ml-1 text-red-500 hover:text-red-700" onclick="event.stopPropagation(); deleteSavedField('tag', '${tag}')">×</span>
            `;
            button.onclick = () => {
                const tagsInput = document.getElementById('tags');
                tagsInput.value = tagsInput.value ? tagsInput.value + ', ' + tag : tag;
            };
            tagsContainer.appendChild(button);
        });
    }
    
    // Message si aucun champ mémorisé
    if ((!savedFields.callers || savedFields.callers.length === 0) && 
        (!savedFields.reasons || savedFields.reasons.length === 0) && 
        (!savedFields.tags || savedFields.tags.length === 0)) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-gray-600 dark:text-gray-400 col-span-2';
        emptyDiv.textContent = 'Aucun champ mémorisé';
        container.appendChild(emptyDiv);
    }
}

/**
 * Formate une date en format français
 * @param {string|Date} dateValue - La date à formater
 * @returns {string} - La date formatée
 */
// Utiliser formatDate de /js/common.js