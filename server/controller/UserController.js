import bcrypt from 'bcrypt';
const axios = require('axios');
const SALT_ROUND = 10;
const geografis = require('geografis');
const moment = require('moment');
import { encryptData, decryptData } from '../helpers/encryption';
import { sequelize } from '../models/init-models';
const AES256 = require('aes-everywhere');
const PW_AES = process.env.PW_AES;
const Redis = require('ioredis');
const redisClient = new Redis({
  host: process.env.IP_REDIS,
  port: process.env.PORT_REDIS,
});

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});
const uuidv4 = require('uuid');

const { body, validationResult } = require('express-validator');

const createValidationRules = [
  body('username').notEmpty().escape().withMessage('Username is required'),
  body('password').notEmpty().escape().withMessage('Password is required'),
];

const signup = async (req, res) => {
  const { files, fields } = req.fileAttrb;

  let hashPassword = fields[1].value;
  hashPassword = await bcrypt.hash(hashPassword, SALT_ROUND);
  try {
    const result = await req.context.models.users.create({
      user_name: fields[0].value,
      user_password: hashPassword,
      user_personal_name: fields[2].value,
      user_email: fields[3].value,
      user_handphone: fields[4].value,
      user_role_id: fields[5].value,
      user_gender_id: fields[6].value,
      user_birth_date: fields[7].value,
      user_photo: files[0].file.originalFilename,
    });
    return res.status(200).json({
      message: 'Sign Up',
      data: result,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// use sigin with token in authJWT
const signin = async (req, res) => {
  await Promise.all(
    createValidationRules.map((validation) => validation.run(req)),
  );

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, password } = req.body;

  const decrypt_username = AES256.decrypt(username, PW_AES);
  const decrypt_password = AES256.decrypt(password, PW_AES);

  try {
    const result = await req.context.models.users.findOne({
      where: { user_name: decrypt_username },
    });
    const { user_id, user_name, user_email, user_password } = result.dataValues;
    const compare = await bcrypt.compare(decrypt_password, user_password);
    if (compare) {
      return res.status(200).json({ user_id, user_name, user_email });
    } else {
      return res.status(404).json({ message: error.message });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const dropdownProvince = async (req, res) => {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.rajaongkir.com/starter/province',
      headers: {
        key: '65358a6c1fa088be3b6fa599a7b1d0ea',
      },
    };

    const response = await axios(config);
    const province = response.data.rajaongkir.results;

    const result = [];
    for (let index = 0; index < province.length; index++) {
      if (province[index].province) {
      }
      const data = {
        province_id: province[index].province_id,
        province: province[index].province,
        // province: req.query.province || province[index].province
      };
      result.push(data);
    }

    return res.status(200).json({
      message: 'Dropdown Province',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const dropdownCity = async (req, res) => {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.rajaongkir.com/starter/city',
      headers: {
        key: '65358a6c1fa088be3b6fa599a7b1d0ea',
      },
    };

    const response = await axios(config);
    const city = response.data.rajaongkir.results;

    const result = [];
    for (let index = 0; index < city.length; index++) {
      const data = {
        city_id: city[index].city_id,
        city_name: city[index].city_name,
        postal_code: city[index].postal_code,
      };

      result.push(data);
    }
    return res.status(200).json({
      message: 'Dropdown Province',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const listGender = async (req, res) => {
  try {
    const result = await req.context.models.gender.findAll({});

    return res.status(200).json({
      message: 'List Gender',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const detailUsers = async (req, res) => {
  try {
    const result = await req.context.models.users.findOne({
      where: { user_id: req.params.id },
      attributes: [
        'user_id',
        'user_name',
        'user_personal_name',
        'user_email',
        'user_handphone',
        'user_photo',
        'user_gender_id',
        'user_birth_date',
      ],
    });

    return res.status(200).json({
      message: 'Detail Users',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updateUsersNoimage = async (req, res) => {
  const {
    user_personal_name,
    user_email,
    user_handphone,
    user_gender_id,
    user_birth_date,
  } = req.body;
  try {
    const result = await req.context.models.users.update(
      {
        user_personal_name: user_personal_name,
        user_email: user_email,
        user_handphone: user_handphone,
        user_gender_id: user_gender_id,
        user_birth_date: user_birth_date,
      },
      {
        returning: true,
        where: { user_id: req.params.id },
      },
    );

    return res.status(200).json({
      message: 'Update Users',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updateUsersImage = async (req, res) => {
  const { files, fields } = req.fileAttrb;
  try {
    const result = await req.context.models.users.update(
      {
        user_personal_name: fields[0].value,
        user_email: fields[1].value,
        user_handphone: fields[2].value,
        user_gender_id: fields[3].value,
        user_birth_date: moment(fields[4].value, 'DD-MM-YYYY'),
        user_photo: files[0].file.originalFilename,
      },
      {
        returning: true,
        where: { user_id: req.params.id },
      },
    );

    return res.status(200).json({
      message: 'Update User With Image',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const createGender = async (req, res) => {
  try {
    const { gender_name } = req.body;
    const result = await req.context.models.gender.create({
      gender_name: gender_name,
    });

    return res.status(200).json({
      message: 'Create Gender',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  const { newPassword, confirmPassword, currentPassword } = req.body;

  try {
    const user = await req.context.models.users.findOne({
      where: { user_id: req.params.id },
    });

    // Validate current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.user_password,
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    // Confirm new password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const hashPassword = await bcrypt.hash(newPassword, SALT_ROUND);

    const result = await req.context.models.users.update(
      { user_password: hashPassword },
      { returning: true, where: { user_id: req.params.id } },
    );

    return res.status(200).json({
      message: 'Change Password',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const listCustomer = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await sequelize.query(
      `
        select 
        user_id as id,
        user_name as username,
        user_email as email,
        user_handphone as no_hp,
        user_birth_date as birth_date,
        user_photo as photo,
        user_personal_name as name
        from users a
        inner join roles b on b.role_id = a.user_role_id
        where role_name = 'customer'
        order by user_created_at desc
        LIMIT :limit OFFSET :start
      `,
      {
        replacements: { limit, start },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countResult = await sequelize.query(
      `
      select 
      count(*) as count
      from users a
      inner join roles b on b.role_id = a.user_role_id
      where role_name = 'customer'
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countFiltered = countResult[0].count;

    let pagination = {};
    pagination.totalRow = parseInt(countFiltered);
    pagination.totalPage = Math.ceil(countFiltered / limit);
    if (end < countFiltered) {
      pagination.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (start > 0) {
      pagination.prev = {
        page: page - 1,
        limit: limit,
      };
    }

    await redisClient.setex(
      'listCustomer',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('listCustomer');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show All Customer (Cached)',
        data: parsedData,
        status: 200,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Show All Customer (Cached)',
      data: result,
      status: 200,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const detailCustomer = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await sequelize.query(
      `
        select 
        a.user_id as id,
        a.user_name as username,
        a.user_email as email,
        a.user_handphone as no_hp,
        a.user_birth_date as birth_date,
        a.user_photo as photo,
        a.user_personal_name as name,
        c.gender_name,
        d.add_id,
        d.add_personal_name,
        d.add_phone_number,
        d.add_address,
        d.add_detail_address,
        d.add_mark,
        d.add_mark_default,
        e.nm as province_name,
        f.nm as city_name,
        g.nm as district_name,
        h.nm as village_name
        from users a
        inner join roles b on b.role_id = a.user_role_id
        left join gender c on c.gender_id = a.user_gender_id
        left join address d on d.add_user_id = a.user_id
        left join dt1 e on e.id = d.add_province
        left join dt2 f on  f.id = d.add_city
        left join dt3 g on g.id = d.add_district
        left join dt4 h on h.id = d.add_village
        where role_name = 'customer'
        and user_id = :id
        order by user_created_at desc
      `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    await redisClient.setex('detailCustomer', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('detailCustomer');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show detail customer (Cached)',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Show detail customer (Cached)',
      data: result,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};
export default {
  signup,
  signin,
  dropdownProvince,
  dropdownCity,
  listGender,
  detailUsers,
  updateUsersImage,
  updateUsersNoimage,
  createGender,
  changePassword,
  listCustomer,
  detailCustomer,
};
