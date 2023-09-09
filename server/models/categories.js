import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid =  require('uuid');

export default class categories extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    cate_id: {
      defaultValue: uuid.v4,
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    cate_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'categories',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "cate_id_pk",
        unique: true,
        fields: [
          { name: "cate_id" },
        ]
      },
    ]
  });
  }
}
