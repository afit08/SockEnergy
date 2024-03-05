require('dotenv').config();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const AES256 = require('aes-everywhere');
const PW_AES = process.env.PW_AES;

import bcrypt from 'bcrypt';

// const jwtSecret = require("crypto").randomBytes(32).toString("hex") || "myjwt";
const jwtSecret = process.env.JWT_SECRET || 'myjwt';
const jwtOpts = { algorithm: 'HS256', expiresIn: '1d' };
import models from '../models/init-models';

passport.use(
  new Strategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async function (username, password, cb) {
      try {
        const decrypt_username = AES256.decrypt(username, PW_AES);
        const decrypt_password = AES256.decrypt(password, PW_AES);

        const result = await models.users.findOne({
          include: [
            {
              model: models.roles,
              as: 'user_role',
              attributes: ['role_name'],
            },
          ],
          where: { user_name: decrypt_username },
        });

        const {
          user_id,
          user_name,
          user_password,
          user_photo,
          user_role: { role_name },
        } = result.dataValues;
        const compare = await bcrypt.compare(decrypt_password, user_password);

        if (compare)
          return cb(null, {
            user_id: user_id,
            username: user_name,
            user_photo,
            userRoles: role_name,
          });
      } catch (error) {
        return cb(null, error.message);
      }

      cb(null, false);
    },
  ),
);

const authenticate = passport.authenticate('local', { session: false });

module.exports = {
  authenticate,
  login: login,
  ensureAdmin: ensureAdmin,
  ensureCustomer: ensureCustomer,
  refreshToken: refreshToken,
};

async function login(req, res, next) {
  if (
    req.user.user_id == undefined &&
    req.user.username == undefined &&
    req.user.userRoles == undefined &&
    req.user.user_photo == undefined
  ) {
    res.status(404).json({
      message: 'Login is Unsuccessfully!',
      success: true,
      status: 404,
    });
  } else {
    const token = await sign({
      user_id: req.user.user_id,
      username: req.user.username,
      roleType: req.user.userRoles,
      user_photo: req.user.user_photo,
    });
    res.cookie('jwt', token, { httpOnly: true });

    res.status(200).json({
      message: 'Login is Successfully!',
      success: true,
      status: 200,
      token: token,
    });
  }
}

async function sign(payload) {
  try {
    const token = await jwt.sign(payload, jwtSecret, jwtOpts);
    return token;
  } catch (error) {
    throw new Error('JWT signing error: ' + error.message);
  }
}

async function ensureCustomer(req, res, next) {
  const jwtString = req.headers.authorization || req.cookies.jwt;
  const payload = await verify(jwtString, req, res);
  if (payload.roleType == 'customer') {
    req.user = payload;
    if (req.user.roleType === 'customer') req.isSeller = true;
    return next();
  }

  const err = new Error('Unauthorized');
  err.statusCode = 401;
  next(err);
}

async function ensureAdmin(req, res, next) {
  const jwtString = req.headers.authorization || req.cookies.jwt;
  const payload = await verify(jwtString, req, res);
  if (payload.roleType == 'admin') {
    req.user = payload;
    if (req.user.roleType === 'admin') req.isSeller = true;
    return next();
  }

  const err = new Error('Unauthorized');
  err.statusCode = 401;
  next(err);
}

async function verify(jwtString = '', req, res) {
  jwtString = jwtString.replace(/^Bearer /i, '');

  try {
    const payload = await jwt.verify(jwtString, jwtSecret);
    return payload;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else {
      return res.status(401).json({ message: 'Token invalid' });
    }
  }
}

async function refreshToken(req, res) {
  const { refreshToken: requestToken } = req.body;

  if (requestToken == null) {
    return res.status(403).json({ message: 'Refresh Token is required!' });
  }

  try {
    const result = await models.tokens.findOne({
      where: { token_id: refreshToken },
    });

    if (!refreshToken) {
      res.status(403).json({ message: 'Refresh token is not in database!' });
      return;
    }

    if (result.token_expire_date.getTime() < new Date().getTime()) {
      res.status(403).json({
        message: 'Refresh token was expired. Please make a new signin request',
      });
      return;
    }

    let newAccessToken = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshToken.token,
    });
  } catch (error) {
    return res.status(500).send({ message: error });
  }
}
