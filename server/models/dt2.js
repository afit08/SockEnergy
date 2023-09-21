import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class dt2 extends Model {
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
    tableName: 'dt2',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "dt2_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
