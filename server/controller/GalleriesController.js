const sequelize = require('../helpers/queryConn.js');

const allGalleries = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await req.context.models.galleries.findAndCountAll({
      order: [['gall_created_at', 'desc']],
      offset: start,
      limit: limit,
    });

    const countFiltered = result.count;

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
      message: 'Show All Galleries',
      data: result.rows,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const allGalleriesSearch = async (req, res) => {
  const { search } = req.body;
  let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
  let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
  let start = (page - 1) * limit;
  let end = page * limit;

  try {
    const result = await sequelize.query(
      `
                select * from galleries
                where lower(gall_name) like lower('%${search}%')
                limit :limit offset :start
            `,
      {
        replacements: { limit, start },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countResult = await sequelize.query(
      `
                select * from galleries
                where lower(gall_name) like lower('%${search}%')
            `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countFiltered = countResult.length;

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
      message: 'Search Galleries',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const createGalleries = async (req, res) => {
  const { files, fields } = req.fileAttrb;
  try {
    const result = await req.context.models.galleries.create({
      gall_name: fields[0].value,
      gall_image: files[0].file.originalFilename,
    });

    return res.status(200).json({
      message: 'Create Galleries',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const detailGalleries = async (req, res) => {
  try {
    const result = await req.context.models.galleries.findAll({
      where: { gall_id: req.params.id },
    });

    return res.status(200).json({
      message: 'Detail Galleries',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateGalleries = async (req, res) => {
  const { files, fields } = req.fileAttrb;

  try {
    const result = await req.context.models.galleries.update(
      {
        gall_name: fields[0].value,
        gall_image: files[0].file.originalFilename,
      },
      {
        returning: true,
        where: { gall_id: req.params.id },
      },
    );

    return res.status(200).json({
      message: 'Update Galleries',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateGalleriesNoImage = async (req, res) => {
  const { gall_name } = req.body;
  try {
    const result = await req.context.models.galleries.update(
      {
        gall_name: gall_name,
      },
      {
        returning: true,
        where: { gall_id: req.params.id },
      },
    );

    return res.status(200).json({
      message: 'Update Galleries',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const deleteGalleries = async (req, res) => {
  try {
    const result = await req.context.models.galleries.destroy({
      where: { gall_id: req.params.id },
    });

    return res.status(200).json({
      message: 'Delete Galleries',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export default {
  allGalleries,
  allGalleriesSearch,
  createGalleries,
  detailGalleries,
  updateGalleries,
  updateGalleriesNoImage,
  deleteGalleries,
};
