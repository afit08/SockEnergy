import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class about extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        abt_id: {
          defaultValue: uuid.v4,
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        abt_title: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        abt_desc: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        abt_image: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        abt_lat: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        abt_long: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'about',
        schema: 'public',
        timestamps: false,
        indexes: [
          {
            name: 'abt_id_pk',
            unique: true,
            fields: [{ name: 'abt_id' }],
          },
        ],
      },
    );
  }
}
