import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class tracking_shipper extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        ts_id: {
          defaultValue: uuid.v4,
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        ts_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        ts_desc: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        ts_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        ts_time: {
          type: DataTypes.TIME,
          allowNull: true,
        },
        ts_fopa_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: 'form_payment',
            key: 'fopa_id',
          },
        },
        ts_created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
      },
      {
        sequelize,
        tableName: 'tracking_shipper',
        schema: 'public',
        timestamps: false,
        indexes: [
          {
            name: 'ts_id_pk',
            unique: true,
            fields: [{ name: 'ts_id' }],
          },
        ],
      },
    );
  }
}
