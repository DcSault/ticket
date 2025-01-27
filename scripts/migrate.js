// scripts/migrate.js
const fs = require('fs').promises;
const { Ticket, Message, SavedField, Tag, User, Archive } = require('../models');

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

        // Migrate archives (if needed)
        if (oldData.archives) {
            for (const archiveTicket of oldData.archives) {
                const newArchive = await Archive.create({
                    ...archiveTicket,
                    messages: undefined
                });

                // Migrate archive messages
                if (archiveTicket.messages && archiveTicket.messages.length > 0) {
                    await Promise.all(archiveTicket.messages.map(msg =>
                        Message.create({
                            ...msg,
                            ArchiveId: newArchive.id
                        })
                    ));
                }
            }
        }

        // Migrate tags (if you have a Tag model)
        if (oldData.tags && oldData.tags.length > 0) {
            await Promise.all(oldData.tags.map(tag => 
                Tag.create({ name: tag })
            ));
        }

        // Migrate saved users (if you have a User model)
        if (oldData.savedUsers && oldData.savedUsers.length > 0) {
            await Promise.all(oldData.savedUsers.map(username => 
                User.findOrCreate({ 
                    where: { username },
                    defaults: { username }
                })
            ));
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error; // Re-throw to ensure error is not silently caught
    }
}

module.exports = migrateData;

// If running directly
if (require.main === module) {
    const sequelize = require('../config/database'); // Adjust path as needed

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