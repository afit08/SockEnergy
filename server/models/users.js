import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class users extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    user_id: {
      defaultValue: uuid.v4,
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    user_name: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    user_email: {
      type: DataTypes.STRING(55),
      allowNull: true
    },
    user_password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_handphone: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    user_role_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'roles',
        key: 'role_id'
      }
    },
    user_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_photo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_personal_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    user_province: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    user_city: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "user_id_pk",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
  }
}
