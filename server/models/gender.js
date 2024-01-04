import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class gender extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        gender_id: {
          defaultValue: uuid.v4,
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        gender_name: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        gender_created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
        gender_updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
      },
      {
        sequelize,
        tableName: 'gender',
        schema: 'public',
        timestamps: false,
        indexes: [
          {
            name: 'gender_id',
            unique: true,
            fields: [{ name: 'gender_id' }],
          },
        ],
      },
    );
  }
}
