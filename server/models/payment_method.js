import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class payment_method extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        payment_id: {
          defaultValue: uuid.v4,
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        payment_name: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        payment_created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
        payment_updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
      },
      {
        sequelize,
        tableName: 'payment_method',
        schema: 'public',
        timestamps: false,
        indexes: [
          {
            name: 'payment_id',
            unique: true,
            fields: [{ name: 'payment_id' }],
          },
        ],
      },
    );
  }
}
