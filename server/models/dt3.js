import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class dt3 extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true
    },
    nm: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'dt3',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "dt3_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
