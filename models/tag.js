// models/tag.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Tag = sequelize.define('Tag', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        tableName: 'tags',
        timestamps: true
    });

    return Tag;
};