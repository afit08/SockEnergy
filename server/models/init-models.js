// import Sequelize from "sequelize";
import _sequelize from 'sequelize';
const DataTypes = _sequelize.DataTypes;
require('dotenv').config();
import _address from './address.js';
import _carts from './carts.js';
import _categories from './categories.js';
import _dt1 from './dt1.js';
import _dt2 from './dt2.js';
import _dt3 from './dt3.js';
import _dt4 from './dt4.js';
import _form_payment from './form_payment.js';
import _galleries from './galleries.js';
import _gender from './gender.js';
import _payment_method from './payment_method.js';
import _products from './products.js';
import _roles from './roles.js';
import _users from './users.js';

const sequelize = require('../helpers/queryConn.js');

const initModels = (sequelize) => {
  const address = _address.init(sequelize, DataTypes);
  const carts = _carts.init(sequelize, DataTypes);
  const categories = _categories.init(sequelize, DataTypes);
  const dt1 = _dt1.init(sequelize, DataTypes);
  const dt2 = _dt2.init(sequelize, DataTypes);
  const dt3 = _dt3.init(sequelize, DataTypes);
  const dt4 = _dt4.init(sequelize, DataTypes);
  const form_payment = _form_payment.init(sequelize, DataTypes);
  const galleries = _galleries.init(sequelize, DataTypes);
  const gender = _gender.init(sequelize, DataTypes);
  const payment_method = _payment_method.init(sequelize, DataTypes);
  const products = _products.init(sequelize, DataTypes);
  const roles = _roles.init(sequelize, DataTypes);
  const users = _users.init(sequelize, DataTypes);

  products.belongsTo(categories, {
    as: 'prod_cate',
    foreignKey: 'prod_cate_id',
  });
  categories.hasMany(products, { as: 'products', foreignKey: 'prod_cate_id' });
  users.belongsTo(gender, { as: 'user_gender', foreignKey: 'user_gender_id' });
  gender.hasMany(users, { as: 'users', foreignKey: 'user_gender_id' });
  carts.belongsTo(products, { as: 'cart_prod', foreignKey: 'cart_prod_id' });
  products.hasMany(carts, { as: 'carts', foreignKey: 'cart_prod_id' });
  users.belongsTo(roles, { as: 'user_role', foreignKey: 'user_role_id' });
  roles.hasMany(users, { as: 'users', foreignKey: 'user_role_id' });
  address.belongsTo(users, { as: 'add_user', foreignKey: 'add_user_id' });
  users.hasMany(address, { as: 'addresses', foreignKey: 'add_user_id' });
  carts.belongsTo(users, { as: 'cart_user', foreignKey: 'cart_user_id' });
  users.hasMany(carts, { as: 'carts', foreignKey: 'cart_user_id' });
  form_payment.belongsTo(users, {
    as: 'fopa_user',
    foreignKey: 'fopa_user_id',
  });
  users.hasMany(form_payment, {
    as: 'form_payments',
    foreignKey: 'fopa_user_id',
  });

  return {
    address,
    carts,
    categories,
    dt1,
    dt2,
    dt3,
    dt4,
    form_payment,
    galleries,
    gender,
    payment_method,
    products,
    roles,
    users,
  };
};

const models = initModels(sequelize);

export default models;
export { sequelize };
