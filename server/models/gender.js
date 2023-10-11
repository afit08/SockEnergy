import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class gender extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    gender_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('uuid_generate_v4'),
      primaryKey: true
    },
    gender_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'gender',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "gender_pkey",
        unique: true,
        fields: [
          { name: "gender_id" },
        ]
      },
    ]
  });
  }
}
