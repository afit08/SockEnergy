import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class rating extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        rat_id: {
          defaultValue: uuid.v4,
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        rat_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        rat_desc: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        rat_user_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id',
          },
        },
        rat_prod_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: 'products',
            key: 'prod_id',
          },
        },
        rat_image: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        rat_created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
        rat_fopa_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'rating',
        schema: 'public',
        timestamps: false,
        indexes: [
          {
            name: 'rat_id_pk',
            unique: true,
            fields: [{ name: 'rat_id' }],
          },
        ],
      },
    );
  }
}
