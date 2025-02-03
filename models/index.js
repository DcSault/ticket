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
    timezone: 'Europe/Paris',
    dialectOptions: {
        useUTC: false,
        dateStrings: true,
        typeCast: true,
        timezone: '+01:00'
    },
    define: {
        timestamps: true,
        hooks: {
            beforeCreate: (record) => {
                if (record.dataValues.createdAt) {
                    record.dataValues.createdAt = new Date(
                        new Date(record.dataValues.createdAt).toLocaleString('en-US', {
                            timeZone: 'Europe/Paris'
                        })
                    );
                }
                if (record.dataValues.updatedAt) {
                    record.dataValues.updatedAt = new Date(
                        new Date(record.dataValues.updatedAt).toLocaleString('en-US', {
                            timeZone: 'Europe/Paris'
                        })
                    );
                }
            }
        }
    }
});

// Fonctions utilitaires pour les dates
const dateHooks = {
    beforeCreate: (record) => {
        const fields = ['createdAt', 'updatedAt', 'lastLogin', 'lastModifiedAt', 'archivedAt'];
        fields.forEach(field => {
            if (record.dataValues[field]) {
                record.dataValues[field] = new Date(
                    new Date(record.dataValues[field]).toLocaleString('en-US', {
                        timeZone: 'Europe/Paris'
                    })
                );
            }
        });
    },
    beforeUpdate: (record) => {
        const fields = ['updatedAt', 'lastModifiedAt', 'archivedAt'];
        fields.forEach(field => {
            if (record.dataValues[field]) {
                record.dataValues[field] = new Date(
                    new Date(record.dataValues[field]).toLocaleString('en-US', {
                        timeZone: 'Europe/Paris'
                    })
                );
            }
        });
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