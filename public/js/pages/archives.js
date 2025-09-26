/**
 * Script pour la page des archives
 */

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async function() {
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search') || '';
    const startDate = urlParams.get('startDate') || '';
    const endDate = urlParams.get('endDate') || '';
    const filter = urlParams.get('filter') || '';
    const value = urlParams.get('value') || '';
    
    // Mettre à jour les champs du formulaire
    document.getElementById('search').value = search;
    document.getElementById('startDate').value = startDate;
    document.getElementById('endDate').value = endDate;
    document.getElementById('filter').value = filter;
    document.getElementById('filterValue').value = value;
    
    // Configurer le bouton de réinitialisation
    document.getElementById('resetButton').addEventListener('click', function() {
        window.location.href = '/archives';
    });
    
    // Charger et afficher les archives
    await loadArchives();
});

/**
 * Charge les archives avec les filtres actuels
 */
async function loadArchives() {
    try {
        // Récupérer les paramètres de l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const filters = {};

        const search = urlParams.get('search');
        if (search) filters.search = search;

        const startDate = urlParams.get('startDate');
        if (startDate) filters.startDate = startDate;

        const endDate = urlParams.get('endDate');
        if (endDate) filters.endDate = endDate;

        const filter = urlParams.get('filter');
        const value = urlParams.get('value');
        if (filter && value) {
            filters.filter = filter;
            filters.value = value;
        }

        // Récupérer les archives via apiClient.js
        const archives = await fetchArchivedTickets(filters);
        
        // Afficher les archives
        renderArchives(archives);
    } catch (error) {
        console.error('Erreur lors du chargement des archives:', error);
        showNotification('Erreur lors du chargement des archives', 'error');
    }
}

/**
 * Récupère les archives depuis l'API
 * @param {Object} filters - Les filtres à appliquer
 * @returns {Promise<Array>} - Les archives
 */
// Utiliser fetchArchivedTickets(filters) depuis /js/apiClient.js

/**
 * Affiche les archives dans la page
 * @param {Array} archives - Les archives à afficher
 */
function renderArchives(archives) {
    const container = document.getElementById('archivesList');
    container.innerHTML = '';
    
    if (archives.length === 0) {
        container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
                Aucune archive trouvée.
            </div>
        `;
        return;
    }
    
    archives.forEach(ticket => {
        const createdDate = formatDate(ticket.createdAt);
        
        let tagsHtml = '';
        if (!ticket.isGLPI && ticket.tags && ticket.tags.length > 0) {
            tagsHtml = '<div class="flex flex-wrap gap-2 mt-2">';
            ticket.tags.forEach(tag => {
                tagsHtml += `
                    <span class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300">
                        ${tag}
                    </span>
                `;
            });
            tagsHtml += '</div>';
        }
        
        let modifiedHtml = '';
        if (ticket.lastModifiedBy) {
            const modifiedDate = formatDate(ticket.lastModifiedAt);
            modifiedHtml = `
                <br>
                Modifié le ${modifiedDate}
                par ${ticket.lastModifiedBy}
            `;
        }
        
        const ticketHtml = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold text-gray-900 dark:text-white">${ticket.caller}</h3>
                            ${ticket.isGLPI ? `
                                <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                                    GLPI
                                </span>
                            ` : ''}
                            ${ticket.isBlocking ? `
                                <span class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded">
                                    Bloquant
                                </span>
                            ` : ''}
                        </div>
                        ${!ticket.isGLPI ? `<p class="text-gray-600 dark:text-gray-300">${ticket.reason}</p>` : ''}
                        ${tagsHtml}
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Créé le ${createdDate}
                            par ${ticket.createdBy}
                            ${modifiedHtml}
                        </p>
                    </div>
                    <button onclick="showTicketDetails('${ticket.id}')"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                        Détails
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML += ticketHtml;
    });
}

/**
 * Affiche les détails d'un ticket
 * @param {string} ticketId - L'ID du ticket
 */
async function showTicketDetails(ticketId) {
    try {
        const response = await fetch(`/api/archives/${ticketId}/details`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails du ticket');
        }
        
        const ticket = await response.json();
        
        const modal = document.getElementById('detailsModal');
        const modalContent = document.getElementById('modalContent');
        
        let tagsHtml = '';
        if (ticket.tags && ticket.tags.length > 0) {
            tagsHtml = '<div class="flex flex-wrap gap-2 mt-2">';
            ticket.tags.forEach(tag => {
                tagsHtml += `
                    <span class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300">
                        ${tag}
                    </span>
                `;
            });
            tagsHtml += '</div>';
        }
        
        const createdDate = formatDate(ticket.createdAt);
        
        let modifiedHtml = '';
        if (ticket.lastModifiedBy) {
            const modifiedDate = formatDate(ticket.lastModifiedAt);
            modifiedHtml = `
                <br>
                Modifié le ${modifiedDate}
                par ${ticket.lastModifiedBy}
            `;
        }
        
        let messagesHtml = '';
        if (ticket.Messages && ticket.Messages.length > 0) {
            messagesHtml = '<div class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4"><h3 class="font-semibold mb-2">Messages</h3>';
            ticket.Messages.forEach(message => {
                const messageDate = formatDate(message.createdAt);
                
                messagesHtml += `
                    <div class="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium">${message.author}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">${messageDate}</span>
                        </div>
                        ${message.type === 'text' 
                            ? `<p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">${message.content}</p>`
                            : `<img src="${message.content}" alt="Image" class="max-w-full h-auto rounded shadow">`
                        }
                    </div>
                `;
            });
            messagesHtml += '</div>';
        }
        
        modalContent.innerHTML = `
            <h2 class="text-xl font-bold mb-2">Détails du ticket</h2>
            <div class="mb-4">
                <h3 class="font-semibold">${ticket.caller}</h3>
                <p class="text-gray-600 dark:text-gray-300">${ticket.reason}</p>
                ${tagsHtml}
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Créé le ${createdDate}
                    par ${ticket.createdBy}
                    ${modifiedHtml}
                </p>
            </div>
            ${messagesHtml}
        `;
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du ticket:', error);
        showNotification('Erreur lors de la récupération des détails du ticket', 'error');
    }
}

/**
 * Ferme la modal de détails
 */
function closeModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}

/**
 * Formate une date
 * @param {string} dateString - La date à formater
 * @returns {string} - La date formatée
 */
// Utiliser formatDate de /js/common.js

// Ajouter un écouteur pour fermer la modal avec la touche Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}); 