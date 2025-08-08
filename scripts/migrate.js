// scripts/migrate.js
const fs = require('fs').promises;
const { Ticket, Message, SavedField } = require('../models');

async function migrateData() {
    try {
        const oldData = JSON.parse(
            await fs.readFile('./data/tickets.json', 'utf8')
        );

        // Migrate tickets
        for (const ticket of oldData.tickets) {
            const newTicket = await Ticket.create({
                ...ticket,
                messages: undefined,
                id: ticket.id // Preserve original ID if needed
            });

            // Migrate messages
            if (ticket.messages && ticket.messages.length > 0) {
                await Promise.all(ticket.messages.map(msg =>
                    Message.create({
                        ...msg,
                        TicketId: newTicket.id
                    })
                ));
            }
        }

        // Migrate saved fields
        const savedFieldsTypes = {
            callers: 'caller',
            reasons: 'reason',
            tags: 'tag'
        };

        for (const [type, values] of Object.entries(oldData.savedFields)) {
            await Promise.all(values.map(value =>
                SavedField.create({ 
                    type: savedFieldsTypes[type] || type, 
                    value 
                })
            ));
        }

        // Archives non supportées dans le nouveau modèle (isArchived sur Ticket)

        // Tags en base sont stockés dans Ticket.tags (ARRAY), pas de table Tag dédiée

        // Utilisateurs non migrés dans ce script

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error; // Re-throw to ensure error is not silently caught
    }
}

module.exports = migrateData;

// If running directly
if (require.main === module) {
    const { sequelize } = require('../models');
    sequelize.sync()
        .then(() => migrateData())
        .then(() => {
            console.log('Database synchronized and data migrated');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration error:', error);
            process.exit(1);
        });
}