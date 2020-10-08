import DataTypes from 'sequelize'
export default (sequelize) => {
    const Message = sequelize.define('messages', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        src: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        dst: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    })

    return Message
}
