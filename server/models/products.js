import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class products extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    prod_id: {
      defaultValue: uuid.v4,
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    prod_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    prod_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    prod_price: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    prod_desc: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    prod_cate_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'categories',
        key: 'cate_id'
      }
    }
  }, {
    sequelize,
    tableName: 'products',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "prod_id_pk",
        unique: true,
        fields: [
          { name: "prod_id" },
        ]
      },
    ]
  });
  }
}
