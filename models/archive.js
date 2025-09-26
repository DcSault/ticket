// models/archive.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Archive = sequelize.define('Archive', {
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
        tableName: 'archives',
        timestamps: true
    });

    return Archive;
};