const geografis = require('geografis');

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

    return res.status(200).json({
      message: 'Show Province',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
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

    return res.status(200).json({
      message: 'Show City',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
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

    return res.status(200).json({
      message: 'Show Kecamatan',
      data: result,
    });
  } catch (error) {
    return res.status(200).json({
      message: error.message,
    });
  }
};

const showVillage = async (req, res) => {
  try {
    const district = geografis.getDistrict(req.params.id);
    const village = district.villages;
    console.log(village);
    const result = [];
    for (let index = 0; index < village.length; index++) {
      const data = {
        id: village[index].code,
        name: village[index].village,
      };
      result.push(data);
    }

    return res.status(200).json({
      message: 'Show Kelurahan',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const showArea = async (req, res) => {
  try {
    const village = geografis.getVillage(req.params.id);
    const result = [village];

    return res.status(200).json({
      message: 'Show Area',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const createAddress = async (req, res) => {
  try {
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
      message: 'Create Address',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const showAddress = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await req.context.models.address.findAll({
      where: { add_user_id: req.user.user_id },
      offset: start,
      limit: limit,
    });

    const countResult = await req.context.models.address.findAndCountAll({});

    const countFiltered = countResult.count;

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

    return res.status(200).json({
      message: 'Show all address',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const detailAddress = async (req, res) => {
  try {
    const result = await req.context.models.address.findAll({
      where: { add_id: req.params.id },
    });

    return res.status(200).json({
      message: 'Detail Address',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateAddress = async (req, res) => {
  try {
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

    return res.status(200).json({
      message: 'Edit address',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const result = await req.context.models.address.destroy({
      where: { add_id: req.params.id },
    });

    return res.status(200).json({
      message: 'Delete Address',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
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
