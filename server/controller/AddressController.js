const geografis = require('geografis');
const Redis = require('ioredis');
const sequelize = require('../helpers/queryConn.js');
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

const { body, validationResult } = require('express-validator');
const uuidv4 = require('uuid');

const createValidationRules = [
  body('add_personal_name')
    .notEmpty()
    .escape()
    .withMessage('Personal name is required'),
  body('add_phone_number')
    .notEmpty()
    .escape()
    .withMessage('Phone number is required'),
  body('add_province').notEmpty().escape().withMessage('Province is required'),
  body('add_city').notEmpty().escape().withMessage('City is required'),
  body('add_district').notEmpty().escape().withMessage('District is required'),
  body('add_village').notEmpty().escape().withMessage('Village is required'),
  body('add_address').notEmpty().escape().withMessage('Address is required'),
  body('add_detail_address')
    .notEmpty()
    .escape()
    .withMessage('Detail Address is required'),
  body('add_mark').notEmpty().escape().withMessage('Mark is required'),
  body('add_mark_default')
    .notEmpty()
    .escape()
    .withMessage('Mark Default is required'),
];

const showProvince = async (req, res) => {
  try {
    const provinces = geografis.getProvinces();

    const result = [];
    for (let index = 0; index < provinces.length; index++) {
      const data = {
        id: provinces[index].code,
        name: provinces[index].province,
      };
      result.push(data);
    }

    await redisClient.setex('showProvince', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('showProvince');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show Province',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Show Province',
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

const showCity = async (req, res) => {
  try {
    const province = geografis.getProvince(req.params.id);
    const city = province.cities;

    const result = [];
    for (let index = 0; index < city.length; index++) {
      const data = {
        id: city[index].code,
        name: city[index].city,
      };
      result.push(data);
    }

    await redisClient.setex('showCity', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('showCity');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show City',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Show City',
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

const showDistrict = async (req, res) => {
  try {
    const city = geografis.getCity(req.params.id);
    const district = city.districts;

    const result = [];
    for (let index = 0; index < district.length; index++) {
      const data = {
        id: district[index].code,
        name: district[index].district,
      };
      result.push(data);
    }

    await redisClient.setex('showDistrict', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('showDistrict');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show Kecamatan',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Show Kecamatan',
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

const showVillage = async (req, res) => {
  try {
    const district = geografis.getDistrict(req.params.id);
    const village = district.villages;

    const result = [];
    for (let index = 0; index < village.length; index++) {
      const data = {
        id: village[index].code,
        name: village[index].village,
      };
      result.push(data);
    }

    await redisClient.setex('showVillage', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('showVillage');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show Kelurahan',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Show Kelurahan',
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

const showArea = async (req, res) => {
  try {
    const village = geografis.getVillage(req.params.id);
    const result = [village];

    await redisClient.setex('showArea', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('showArea');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show Area',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Show Area',
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

const createAddress = async (req, res) => {
  try {
    await Promise.all(
      createValidationRules.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      add_personal_name,
      add_phone_number,
      add_province,
      add_city,
      add_district,
      add_village,
      add_address,
      add_detail_address,
      add_mark,
      add_mark_default,
    } = req.body;

    const result = await req.context.models.address.create({
      add_personal_name: add_personal_name,
      add_phone_number: add_phone_number,
      add_province: add_province,
      add_city: add_city,
      add_district: add_district,
      add_village: add_village,
      add_address: add_address,
      add_detail_address: add_detail_address,
      add_mark: add_mark,
      add_mark_default: add_mark_default,
      add_user_id: req.user.user_id,
    });

    return res.status(200).json({
      message: 'Create address successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const showAddress = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await sequelize.query(
      `
      select 
      adds.add_id as id,
      adds.add_personal_name as personal_name,
      prov.nm as province,
      city.nm as city,
      district.nm as district,
      village.nm as village,
      adds.add_address as address,
      adds.add_detail_address as detail_address,
      adds.add_mark as mark,
      adds.add_mark_default as default,
      adds.add_user_id as user_id,
      adds.add_created_at as created_at,
      adds.add_updated_at as updated_at
      from address as adds
      left join dt1 as prov on prov.id = adds.add_province
      left join dt2 as city on city.id = adds.add_city
      left join dt3 as district on district.id = adds.add_district
      left join dt4 as village on village.id = adds.add_village
      where adds.add_user_id = :id 
      LIMIT :limit OFFSET :start
      `,
      {
        replacements: { limit, start, id: req.user.user_id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countResult = await sequelize.query(
      `
      select 
      count(*) as total
      from address as adds
      left join dt1 as prov on prov.id = adds.add_province
      left join dt2 as city on city.id = adds.add_city
      left join dt3 as district on district.id = adds.add_district
      left join dt4 as village on village.id = adds.add_village
      where adds.add_user_id = :id
      `,
      {
        replacements: { id: req.user.user_id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countFiltered = countResult[0].total;

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
      'showAddress',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('showAddress');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show Address',
        data: parsedData,
        status: 200,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Show all address',
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

const detailAddress = async (req, res) => {
  try {
    const [result] = await sequelize.query(
      `
      select 
      adds.add_id as id,
      adds.add_personal_name as personal_name,
      prov.id as id_province,
      prov.nm as province,
      city.id as id_city,
      city.nm as city,
      district.id as id_district,
      district.nm as district,
      village.id as id_village,
      village.nm as village,
      adds.add_address as address,
      adds.add_detail_address as detail_address,
      adds.add_mark as mark,
      adds.add_mark_default as default,
      adds.add_user_id as user_id,
      adds.add_created_at as created_at,
      adds.add_updated_at as updated_at
      from address as adds
      inner join dt1 as prov on prov.id = adds.add_province
      inner join dt2 as city on city.id = adds.add_city
      inner join dt3 as district on district.id = adds.add_district
      inner join dt4 as village on village.id = adds.add_village
      where adds.add_id = :id 
      `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    await redisClient.setex('detailAddress', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('detailAddress');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Detail Address',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Detail Address',
      data: result,
      status: 200,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
      status: 500,
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    await Promise.all(
      createValidationRules.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      add_personal_name,
      add_phone_number,
      add_province,
      add_city,
      add_district,
      add_village,
      add_address,
      add_detail_address,
      add_mark,
      add_mark_default,
    } = req.body;

    const result = await req.context.models.address.update(
      {
        add_personal_name: add_personal_name,
        add_phone_number: add_phone_number,
        add_province: add_province,
        add_city: add_city,
        add_district: add_district,
        add_village: add_village,
        add_address: add_address,
        add_detail_address: add_detail_address,
        add_mark: add_mark,
        add_mark_default: add_mark_default,
      },
      { returning: true, where: { add_id: req.params.id } },
    );

    if (result[1][0] == undefined) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Edit address successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await req.context.models.address.destroy({
      where: { add_id: req.params.id },
    });

    if (result == 0) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Delete Address',
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
  showProvince,
  createAddress,
  showCity,
  showDistrict,
  showVillage,
  showArea,
  showAddress,
  detailAddress,
  updateAddress,
  deleteAddress,
};
