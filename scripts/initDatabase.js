async function initTables() {
    const sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        logging: console.log // Activons temporairement le logging pour debug
    });

    try {
        // Import des modèles
        const { User, Ticket, Message, SavedField } = require('../models');

        // Force la recréation des tables
        await sequelize.sync({ force: true }); // Attention: ceci supprimera les données existantes
        
        console.log('✅ Tables synchronisées avec succès');
        
        // Vérifions que les tables existent
        await User.findAll();
        console.log('✅ Table User accessible');
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation des tables:', error);
        return false;
    } finally {
        await sequelize.close();
    }
}