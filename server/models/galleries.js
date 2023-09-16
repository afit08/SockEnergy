import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class galleries extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    gall_id: {
      defaultValue: uuid.v4,
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    gall_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    gall_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gall_created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'galleries',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "gall_id_pk",
        unique: true,
        fields: [
          { name: "gall_id" },
        ]
      },
    ]
  });
  }
}
