require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testConnection() {
    // D'abord, on teste la connexion à PostgreSQL sans spécifier de base de données
    const mainSequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
        logging: false
    });

    try {
        await mainSequelize.authenticate();
        console.log('✅ Connection au serveur PostgreSQL réussie !');

        // Ensuite, on vérifie si la base de données existe
        const [results] = await mainSequelize.query(
            `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`
        );

        if (results.length === 0) {
            console.log(`⚠️  La base de données '${process.env.DB_NAME}' n'existe pas encore`);
            
            // On tente de la créer
            try {
                await mainSequelize.query(`CREATE DATABASE ${process.env.DB_NAME}`);
                console.log(`✅ Base de données '${process.env.DB_NAME}' créée avec succès`);
            } catch (error) {
                console.error('❌ Erreur lors de la création de la base de données:', error);
                return false;
            }
        } else {
            console.log(`✅ La base de données '${process.env.DB_NAME}' existe`);
        }

        return true;
    } catch (error) {
        console.error('❌ Impossible de se connecter à PostgreSQL:', error);
        return false;
    } finally {
        await mainSequelize.close();
    }
}

module.exports = testConnection;

// Si exécuté directement
if (require.main === module) {
    testConnection().then(success => {
        if (!success) process.exit(1);
    });
}