import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class roles extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        role_id: {
          defaultValue: uuid.v4,
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        role_name: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        role_created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
        role_updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
      },
      {
        sequelize,
        tableName: 'roles',
        schema: 'public',
        timestamps: false,
        indexes: [
          {
            name: 'role_id',
            unique: true,
            fields: [{ name: 'role_id' }],
          },
        ],
      },
    );
  }
}
