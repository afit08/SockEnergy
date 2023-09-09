import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class carts extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    cart_id: {
      defaultValue: uuid.v4,
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    cart_qty: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cart_prod_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'products',
        key: 'prod_id'
      }
    },
    cart_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    cart_user_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    }
  }, {
    sequelize,
    tableName: 'carts',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "cart_id_pk",
        unique: true,
        fields: [
          { name: "cart_id" },
        ]
      },
      {
        name: "carts_pkey",
        unique: true,
        fields: [
          { name: "cart_id" },
        ]
      },
    ]
  });
  }
}
