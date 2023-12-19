const sequelize = require('../helpers/queryConn.js');
const sanitizer = require('sanitizer');

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

    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).json({
      message: 'Show All Galleries',
      data: result.rows,
      pagination: pagination,
    });
  } catch (error) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(404).json({
      message: error.message,
    });
  }
};

const allGalleriesSearch = async (req, res) => {
  let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
  let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
  let start = (page - 1) * limit;
  let end = page * limit;

  try {
    // validation and sanitation
    const search = req.body.search;
    sanitizer.escape(search);
    sanitizer.normalizeRCData(search);
    sanitizer.sanitize(search);

    console.log(search);
    if (!/^[a-zA-Z0-9]+$/.test(search)) {
      return res.status(400).json('invalid input');
    }

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

    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).json({
      message: 'Search Galleries',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(404).json({
      message: error.message,
    });
  }
};

const createGalleries = async (req, res) => {
  const { files, fields } = req.fileAttrb;
  try {
    // validation and sanitation
    const gall_name = req.fileAttrb.fields[0].value;
    sanitizer.escape(gall_name);
    sanitizer.normalizeRCData(gall_name);
    sanitizer.sanitize(gall_name);

    console.log(gall_name);
    if (!/^[a-zA-Z0-9]+$/.test(gall_name)) {
      return res.status(400).json('invalid input');
    }

    const result = await req.context.models.galleries.create({
      gall_name: fields[0].value,
      gall_image: files[0].file.originalFilename,
    });

    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).json({
      message: 'Create Galleries',
      data: result,
    });
  } catch (error) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

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

    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).json({
      message: 'Detail Galleries',
      data: result,
    });
  } catch (error) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateGalleries = async (req, res) => {
  const { files, fields } = req.fileAttrb;

  try {
    // validation and sanitation
    const gall_name = req.fileAttrb.fields[0].value;
    sanitizer.escape(gall_name);
    sanitizer.normalizeRCData(gall_name);
    sanitizer.sanitize(gall_name);

    console.log(gall_name);
    if (!/^[a-zA-Z0-9]+$/.test(gall_name)) {
      return res.status(400).json('invalid input');
    }

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

    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).json({
      message: 'Update Galleries',
      data: result[1][0],
    });
  } catch (error) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateGalleriesNoImage = async (req, res) => {
  try {
    // validation and sanitation
    const gall_name = req.body.gall_name;
    sanitizer.escape(gall_name);
    sanitizer.normalizeRCData(gall_name);
    sanitizer.sanitize(gall_name);

    console.log(gall_name);
    if (!/^[a-zA-Z0-9]+$/.test(gall_name)) {
      return res.status(400).json('invalid input');
    }

    const result = await req.context.models.galleries.update(
      {
        gall_name: gall_name,
      },
      {
        returning: true,
        where: { gall_id: req.params.id },
      },
    );

    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).json({
      message: 'Update Galleries',
      data: result[1][0],
    });
  } catch (error) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

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

    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).json({
      message: 'Delete Galleries',
      data: result,
    });
  } catch (error) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=2147483648; includeSubdomains; preload',
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(404).json({
      message: error.message,
    });
  }
};

const ValidationSanitization = async (req, res) => {
  try {
    const input = req.body.username;
    console.log(input);
    const escape = sanitizer.escape(input);
    const normalizeRCData = sanitizer.normalizeRCData(input);
    console.log(escape);
    console.log(normalizeRCData);
    // if (input == '<script>alert("xss attack");</script>') {
    //   return res.status(400).json('invalid input');
    // }
  } catch (error) {}
};

export default {
  allGalleries,
  allGalleriesSearch,
  createGalleries,
  detailGalleries,
  updateGalleries,
  updateGalleriesNoImage,
  deleteGalleries,
  ValidationSanitization,
};
