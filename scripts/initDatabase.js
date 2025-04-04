const { Sequelize } = require('sequelize');
const moment = require('moment-timezone');
require('dotenv').config();

// Fonction pour détecter dynamiquement le décalage horaire actuel pour Europe/Paris
function getCurrentTimezoneOffset() {
    // Obtenir le décalage horaire actuel pour Europe/Paris en minutes
    const offsetInMinutes = moment().tz('Europe/Paris').utcOffset();
    // Convertir en format +HH:00
    const hours = Math.abs(Math.floor(offsetInMinutes / 60));
    const sign = offsetInMinutes >= 0 ? '+' : '-';
    return `${sign}${String(hours).padStart(2, '0')}:00`;
}

async function initTables() {
    const currentOffset = getCurrentTimezoneOffset();
    console.log(`Décalage horaire actuel pour Europe/Paris: ${currentOffset}`);

    const sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        logging: console.log, // Logging pour debug
        // Définit le fuseau horaire UTC pour éviter les doubles conversions
        timezone: '+00:00', 
        dialectOptions: {
            useUTC: true,
            dateStrings: true,
            typeCast: true
        }
    });

    try {
        // Import des modèles
        const { User, Ticket, Message, SavedField } = require('../models');

        // Configurer le fuseau horaire de la base de données sur UTC
        await sequelize.query("ALTER DATABASE " + process.env.DB_NAME + " SET timezone TO 'UTC';");
        console.log('✅ Fuseau horaire configuré sur UTC');

        // Force la recréation des tables
        await sequelize.sync({ force: true });
        
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