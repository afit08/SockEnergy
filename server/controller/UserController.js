import bcrypt from 'bcrypt';
const axios = require('axios');
const SALT_ROUND = 10;
const geografis = require('geografis');

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

export default {
  signup,
  signin,
  dropdownProvince,
  dropdownCity,
};
