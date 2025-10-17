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
 * @returns {Promise<Object>} - Promesse résolue avec {tickets: Array, pagination: Object}
 */
async function fetchActiveTickets() {
    try {
        const response = await fetch('/api/tickets');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des tickets');
        }
        const data = await response.json();
        
        // Retourner la structure complète {tickets, pagination}
        // ou juste un tableau pour rétrocompatibilité
        return data.tickets ? data : { tickets: data, pagination: null };
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des tickets', 'error');
        return { tickets: [], pagination: null };
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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création du ticket');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(error.message || 'Erreur lors de la création du ticket', 'error');
        throw error;
    }
}

/**
 * Met à jour un ticket existant
 * @param {string} ticketId - ID du ticket à mettre à jour
 * @param {Object} ticketData - Nouvelles données du ticket
 * @returns {Promise<Object>} - Promesse résolue avec le ticket mis à jour
 */
async function updateTicket(ticketId, ticketData) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}/edit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticketData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la mise à jour du ticket');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(error.message || 'Erreur lors de la mise à jour du ticket', 'error');
        throw error;
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

/**
 * Récupère les statistiques globales
 * @returns {Promise<Object>} - Promesse résolue avec les données statistiques
 */
async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des statistiques');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des statistiques', 'error');
        return null;
    }
}

/**
 * Récupère les données de rapport pour une date donnée
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<Object>} - Promesse résolue avec les données du rapport
 */
async function fetchReportData(date) {
    try {
        const response = await fetch(`/api/report-data?date=${date}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du rapport');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération du rapport', 'error');
        return null;
    }
}

/**
 * Récupère la liste des utilisateurs
 * @returns {Promise<Array>} - Promesse résolue avec la liste des utilisateurs
 */
async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des utilisateurs');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des utilisateurs', 'error');
        return [];
    }
}

/**
 * Récupère les détails d'une archive
 * @param {string} archiveId - ID de l'archive
 * @returns {Promise<Object>} - Promesse résolue avec les détails de l'archive
 */
async function fetchArchiveDetails(archiveId) {
    try {
        const response = await fetch(`/api/archives/${archiveId}/details`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails de l\'archive');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la récupération des détails de l\'archive', 'error');
        return null;
    }
}

/**
 * Archive un ticket
 * @param {string} ticketId - ID du ticket à archiver
 * @returns {Promise<Object>} - Promesse résolue avec la réponse du serveur
 */
async function archiveTicketAPI(ticketId) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}/archive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de l\'archivage');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(error.message || 'Erreur lors de l\'archivage du ticket', 'error');
        throw error;
    }
}

/**
 * Supprime un ticket
 * @param {string} ticketId - ID du ticket à supprimer
 * @returns {Promise<Object>} - Promesse résolue avec la réponse du serveur
 */
async function deleteTicketAPI(ticketId) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(error.message || 'Erreur lors de la suppression du ticket', 'error');
        throw error;
    }
} 