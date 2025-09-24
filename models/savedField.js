const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['type', 'value']
            }
        ]
    });

    return SavedField;
};