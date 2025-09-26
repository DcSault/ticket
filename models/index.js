const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
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

const currentOffset = getCurrentTimezoneOffset();
console.log(`Décalage horaire actuel pour Europe/Paris: ${currentOffset}`);

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    logging: false,
    timezone: '+00:00',
    dialectOptions: {
        useUTC: true,
        dateStrings: true,
        typeCast: true
    },
    define: {
        timestamps: true,
        hooks: {
            beforeCreate: (record) => {
                // Supprimer les hooks de conversion de fuseau horaire
                // qui peuvent créer des décalages supplémentaires
            }
        }
    }
});

// Fonctions utilitaires pour les dates - sans conversion de fuseau horaire
const dateHooks = {
    beforeCreate: (record) => {
        // Supprimer la conversion qui crée un double décalage
    },
    beforeUpdate: (record) => {
        // Supprimer la conversion qui crée un double décalage
    }
};

// Définir les modèles
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    hooks: dateHooks,
    tableName: 'users'
});

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    caller: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('open', 'closed'),
        defaultValue: 'open'
    },
    isGLPI: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    glpiNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isBlocking: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdBy: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastModifiedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastModifiedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    archivedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    archivedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    hooks: dateHooks,
    tableName: 'tickets'
});

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('text', 'image'),
        defaultValue: 'text'
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    hooks: dateHooks,
    tableName: 'messages'
});

const SavedField = sequelize.define('SavedField', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('caller', 'reason', 'tag'),
        allowNull: false
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    hooks: dateHooks,
    tableName: 'saved_fields',
    indexes: [
        {
            unique: true,
            fields: ['type', 'value']
        }
    ]
});

// Définir les associations
Ticket.hasMany(Message);
Message.belongsTo(Ticket);

// Exporter les modèles et la connexion
module.exports = {
    sequelize,
    User,
    Ticket,
    Message,
    SavedField
};