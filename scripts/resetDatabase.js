require('dotenv').config();
const { Sequelize } = require('sequelize');
const moment = require('moment-timezone');

// Fonction pour détecter dynamiquement le décalage horaire actuel pour Europe/Paris
function getCurrentTimezoneOffset() {
    // Obtenir le décalage horaire actuel pour Europe/Paris en minutes
    const offsetInMinutes = moment().tz('Europe/Paris').utcOffset();
    // Convertir en format +HH:00
    const hours = Math.abs(Math.floor(offsetInMinutes / 60));
    const sign = offsetInMinutes >= 0 ? '+' : '-';
    return `${sign}${String(hours).padStart(2, '0')}:00`;
}

async function resetDatabase() {
    console.log('🚀 Début de la réinitialisation complète...');

    const currentOffset = getCurrentTimezoneOffset();
    console.log(`Décalage horaire actuel pour Europe/Paris: ${currentOffset}`);

    const mainSequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
        logging: false,
        timezone: 'Europe/Paris',
        dialectOptions: {
            useUTC: false,
            dateStrings: true,
            typeCast: true,
            timezone: currentOffset // Utilisation du décalage horaire détecté dynamiquement
        }
    });

    try {
        await mainSequelize.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME};`);
        console.log('✅ Base de données supprimée');

        await mainSequelize.query(`CREATE DATABASE ${process.env.DB_NAME};`);
        console.log('✅ Nouvelle base de données créée');

        // Configurer le fuseau horaire immédiatement après la création
        await mainSequelize.query(`ALTER DATABASE ${process.env.DB_NAME} SET timezone TO 'Europe/Paris';`);
        console.log('✅ Fuseau horaire configuré sur Europe/Paris');

        // Importer les modèles et créer les tables
        const { sequelize, User, Ticket, Message, SavedField } = require('../models');
        
        await sequelize.sync({ force: true });
        console.log('✅ Tables créées avec succès');

        console.log('✨ Réinitialisation terminée avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
        return false;
    } finally {
        await mainSequelize.close();
    }
}

if (require.main === module) {
    resetDatabase().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = resetDatabase;