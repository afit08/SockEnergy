import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class payment_method extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    payment_id: {
      defaultValue: uuid.v4,
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    payment_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'payment_method',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "payment_id_pk",
        unique: true,
        fields: [
          { name: "payment_id" },
        ]
      },
    ]
  });
  }
}
