import bcrypt from 'bcrypt';
const axios = require('axios');
const SALT_ROUND = 10;
const geografis = require('geografis');
const moment = require('moment');

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
  const { username, password } = req.body;

  try {
    const result = await req.context.models.users.findOne({
      where: { user_name: username },
    });
    const { user_id, user_name, user_email, user_password } = result.dataValues;
    const compare = await bcrypt.compare(password, user_password);
    if (compare) {
      return res.send({ user_id, user_name, user_email });
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    return res.sendStatus(404);
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
};
