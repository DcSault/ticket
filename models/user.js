const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
        tableName: 'users', 
        timestamps: true
    });

    return User;
};