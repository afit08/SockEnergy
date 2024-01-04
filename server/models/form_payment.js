import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;
const uuid = require('uuid');

export default class form_payment extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        fopa_id: {
          defaultValue: uuid.v4,
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        fopa_ongkir: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        fopa_payment: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        fopa_image_transaction: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        fopa_rek: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        fopa_start_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        fopa_end_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        fopa_status: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        fopa_no_order_first: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        fopa_no_order_second: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        fopa_desc_ongkir: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        fopa_etd_ongkir: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        fopa_number_resi: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        fopa_user_id: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id',
          },
        },
        fopa_created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
        fopa_updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: Sequelize.Sequelize.fn('now'),
        },
      },
      {
        sequelize,
        tableName: 'form_payment',
        schema: 'public',
        timestamps: false,
        indexes: [
          {
            name: 'fopa_id',
            unique: true,
            fields: [{ name: 'fopa_id' }],
          },
        ],
      },
    );
  }
}
