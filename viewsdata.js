const { sequelize, Ticket } = require('./models'); // Importez vos modèles Sequelize

// Fonction pour récupérer et afficher les tickets
async function fetchAndDisplayTickets() {
    try {
        // Connexion à la base de données
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données établie');

        // Récupérer tous les tickets (archivés et non archivés)
        const tickets = await Ticket.findAll({
            order: [['createdAt', 'DESC']] // Tri par date de création décroissante
        });

        // Afficher les tickets dans la console
        if (tickets && tickets.length > 0) {
            console.log("Liste des tickets :");
            tickets.forEach((ticket, index) => {
                console.log(`\nTicket #${index + 1}:`);
                console.log(`- ID: ${ticket.id}`);
                console.log(`- Appelant: ${ticket.caller}`);
                console.log(`- Raison: ${ticket.reason}`);
                console.log(`- Tags: ${ticket.tags.join(', ')}`);
                console.log(`- Statut: ${ticket.status}`);
                console.log(`- Créé par: ${ticket.createdBy}`);
                console.log(`- Date de création: ${new Date(ticket.createdAt).toLocaleString()}`);
                console.log(`- GLPI: ${ticket.isGLPI ? 'Oui' : 'Non'}`);
                console.log(`- Archivé: ${ticket.isArchived ? 'Oui' : 'Non'}`);
            });
        } else {
            console.log("Aucun ticket à afficher.");
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des tickets :', error);
    } finally {
        // Fermer la connexion à la base de données
        await sequelize.close();
        console.log('✅ Connexion à la base de données fermée');
    }
}

// Exécuter la fonction
fetchAndDisplayTickets();