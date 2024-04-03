const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' });
}

module.exports = generateToken;
