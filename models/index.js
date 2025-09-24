const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    logging: false,
    // Le support du fuseau horaire de Sequelize avec PostgreSQL est robuste.
    // Il est recommandé de stocker les dates en UTC (comportement par défaut)
    // et de les convertir dans le fuseau horaire de l'utilisateur au niveau de l'application.
    timezone: '+00:00', 
});

// Pas besoin de hooks pour les dates, Sequelize gère bien l'UTC.
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
    tableName: 'saved_fields',
    timestamps: false, // Ce modèle n'a pas besoin de timestamps
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