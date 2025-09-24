/**
 * Fonctions communes pour les appels API
 */

/**
 * Récupère les informations de l'utilisateur connecté
 * @returns {Promise<Object>} - Promesse résolue avec les données de l'utilisateur
 */
async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des informations utilisateur');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des informations utilisateur', 'error');
        return null;
    }
}

/**
 * Récupère la liste des tickets actifs
 * @returns {Promise<Array>} - Promesse résolue avec la liste des tickets
 */
async function fetchActiveTickets() {
    try {
        const response = await fetch('/api/tickets');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des tickets');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des tickets', 'error');
        return [];
    }
}

/**
 * Récupère les détails d'un ticket
 * @param {string} ticketId - ID du ticket à récupérer
 * @returns {Promise<Object>} - Promesse résolue avec les détails du ticket
 */
async function fetchTicketDetails(ticketId) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails du ticket');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des détails du ticket', 'error');
        return null;
    }
}

/**
 * Récupère les champs mémorisés (appelants, raisons, tags)
 * @returns {Promise<Object>} - Promesse résolue avec les champs mémorisés
 */
async function fetchSavedFields() {
    try {
        const response = await fetch('/api/saved-fields');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des champs mémorisés');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des champs mémorisés', 'error');
        return { callers: [], reasons: [], tags: [] };
    }
}

/**
 * Récupère les tickets archivés avec filtrage optionnel
 * @param {Object} filters - Filtres à appliquer (search, startDate, endDate, filter, value)
 * @returns {Promise<Array>} - Promesse résolue avec la liste des tickets archivés
 */
async function fetchArchivedTickets(filters = {}) {
    try {
        // Construction de l'URL avec les paramètres de filtrage
        let url = '/api/archives';
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.filter && filters.value) {
            params.append('filter', filters.filter);
            params.append('value', filters.value);
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des archives');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des archives', 'error');
        return [];
    }
}

/**
 * Crée un nouveau ticket
 * @param {Object} ticketData - Données du ticket à créer
 * @returns {Promise<Object>} - Promesse résolue avec le ticket créé
 */
async function createTicket(ticketData) {
    try {
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(ticketData)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la création du ticket');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la création du ticket', 'error');
        return null;
    }
}

/**
 * Met à jour un ticket existant
 * @param {string} ticketId - ID du ticket à mettre à jour
 * @param {Object} ticketData - Nouvelles données du ticket
 * @returns {Promise<Object|null>} - Promesse résolue avec la réponse du serveur, ou null en cas d'erreur.
 */
async function updateTicket(ticketId, ticketData) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}/edit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(ticketData)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du ticket');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la mise à jour du ticket', 'error');
        return null;
    }
}

/**
 * Ajoute un message texte à un ticket
 * @param {string} ticketId - ID du ticket
 * @param {string} content - Contenu du message
 * @returns {Promise<Object>} - Promesse résolue avec le message créé
 */
async function addTextMessage(ticketId, content) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout du message');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'ajout du message', 'error');
        return null;
    }
}

/**
 * Ajoute une image à un ticket
 * @param {string} ticketId - ID du ticket
 * @param {File} imageFile - Fichier image à ajouter
 * @returns {Promise<Object>} - Promesse résolue avec le message créé
 */
async function addImageMessage(ticketId, imageFile) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const response = await fetch(`/api/tickets/${ticketId}/messages`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout de l\'image');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'ajout de l\'image', 'error');
        return null;
    }
} 