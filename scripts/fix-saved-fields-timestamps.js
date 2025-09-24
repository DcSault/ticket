const { Sequelize } = require('sequelize');
require('dotenv').config();

async function fixSavedFieldsTimestamps() {
    // Configuration de la connexion à la base de données
    const sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        logging: console.log,
        timezone: '+00:00',
        dialectOptions: {
            useUTC: true,
            dateStrings: true,
            typeCast: true
        }
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie');

        // Vérifier si les colonnes createdAt et updatedAt existent déjà
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'saved_fields' 
            AND column_name IN ('createdAt', 'updatedAt');
        `);

        const existingColumns = results.map(row => row.column_name);
        console.log('🔍 Colonnes existantes:', existingColumns);

        // Si les colonnes n'existent pas, les ajouter avec une valeur par défaut
        if (!existingColumns.includes('createdAt')) {
            console.log('➕ Ajout de la colonne createdAt...');
            await sequelize.query(`
                ALTER TABLE "saved_fields" 
                ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            `);
            console.log('✅ Colonne createdAt ajoutée');

            // Mettre à jour les enregistrements existants pour éviter les valeurs NULL
            await sequelize.query(`
                UPDATE "saved_fields" 
                SET "createdAt" = NOW() 
                WHERE "createdAt" IS NULL;
            `);
            console.log('✅ Valeurs par défaut définies pour createdAt');

            // Maintenant rendre la colonne NOT NULL
            await sequelize.query(`
                ALTER TABLE "saved_fields" 
                ALTER COLUMN "createdAt" SET NOT NULL;
            `);
            console.log('✅ Contrainte NOT NULL ajoutée pour createdAt');
        } else {
            console.log('ℹ️  La colonne createdAt existe déjà');
        }

        if (!existingColumns.includes('updatedAt')) {
            console.log('➕ Ajout de la colonne updatedAt...');
            await sequelize.query(`
                ALTER TABLE "saved_fields" 
                ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            `);
            console.log('✅ Colonne updatedAt ajoutée');

            // Mettre à jour les enregistrements existants
            await sequelize.query(`
                UPDATE "saved_fields" 
                SET "updatedAt" = NOW() 
                WHERE "updatedAt" IS NULL;
            `);
            console.log('✅ Valeurs par défaut définies pour updatedAt');

            // Rendre la colonne NOT NULL
            await sequelize.query(`
                ALTER TABLE "saved_fields" 
                ALTER COLUMN "updatedAt" SET NOT NULL;
            `);
            console.log('✅ Contrainte NOT NULL ajoutée pour updatedAt');
        } else {
            console.log('ℹ️  La colonne updatedAt existe déjà');
        }

        // Vérifier la structure finale de la table
        const [finalResults] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'saved_fields' 
            ORDER BY ordinal_position;
        `);

        console.log('\n📊 Structure finale de la table saved_fields:');
        finalResults.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        console.log('\n✨ Migration terminée avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Exporter la fonction pour utilisation en tant que module
module.exports = fixSavedFieldsTimestamps;

// Si le script est exécuté directement
if (require.main === module) {
    fixSavedFieldsTimestamps()
        .then(() => {
            console.log('🎉 Script terminé avec succès');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}