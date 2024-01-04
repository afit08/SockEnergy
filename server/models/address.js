import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class address extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        add_id: {
          defaultValue: uuid.v4,
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        add_personal_name: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        add_phone_number: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        add_province: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        add_city: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        add_district: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        add_village: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        add_address: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        add_detail_address: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        add_mark: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        add_mark_default: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        add_user_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id',
          },
        },
        add_created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
        add_updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
      },
      {
        sequelize,
        tableName: 'address',
        schema: 'public',
        timestamps: false,
        indexes: [
          {
            name: 'add_id',
            unique: true,
            fields: [{ name: 'add_id' }],
          },
        ],
      },
    );
  }
}
