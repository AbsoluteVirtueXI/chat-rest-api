import DataTypes from 'sequelize'
export default (sequelize) => {
    const User = sequelize.define('users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING(20),
            unique: true,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(30),
            unique: true,
            allowNull: false,
        },
        api_key: {
            type: DataTypes.UUID,
            unique: true,
            defaultValue: DataTypes.UUIDV1, // generated form squelize
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    })

    return User
}
