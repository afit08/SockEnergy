const sequelize = require('../helpers/queryConn');
const geografis = require('geografis');
const Redis = require('ioredis');
const axios = require('axios');
const qs = require('qs');
const uuidv4 = require('uuid');

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

const createValidationRules = [
  body('fopa_number_resi')
    .notEmpty()
    .escape()
    .withMessage('Number resi name is required'),
];

const allOrders = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await sequelize.query(
      `
        SELECT 
        fopa_id AS id,
        fopa_no_order_second AS no_order,
        fopa_created_at AS date, 
        fopa_payment AS payment
        FROM 
            form_payment
        WHERE 
            (fopa_status = 'payment')
            OR 
            (fopa_status = 'unpayment' OR fopa_payment = 'Cash on Delivery')
        ORDER BY 
            fopa_created_at DESC  
        LIMIT :limit OFFSET :start
    `,
      {
        replacements: { limit, start },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    // Count Pagination

    const countResult = await sequelize.query(
      `
      SELECT 
      COUNT(*) AS count
      FROM 
          form_payment
      WHERE 
          (fopa_status = 'payment')
          OR 
          (fopa_status = 'unpayment' AND fopa_payment = 'Cash on Delivery')
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    let countFiltered = 0;
    if (countResult.length > 0) {
      countFiltered = countResult[0].count;
    }

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
      'allOrders',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('allOrders');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'allOrders (Cached)',
        data: parsedData,
        pagination: pagination,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'All Orders',
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

const detailOrder = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const [result] = await sequelize.query(
      `
      select 
      a.fopa_id,
      a.fopa_ongkir,
      a.fopa_payment,
      a.fopa_image_transaction,
      a.fopa_rek,
      a.fopa_start_date,
      a.fopa_end_date,
      a.fopa_status,
      b.add_personal_name,
      b.add_phone_number,
      b.add_address,
      b.add_village,
      b.add_mark
      from form_payment a
      inner join address b on b.add_user_id = a.fopa_user_id
      where (fopa_status = 'payment') 
      or (fopa_status = 'unpayment' OR fopa_payment = 'Cash on Delivery')
      and (add_mark_default = 'default')
      and fopa_id = :id;
          `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );
    const village = geografis.getVillage(result.add_village);

    const data_product = await sequelize.query(
      `
        select 
        a.cart_id,
        a.cart_qty,
        b.prod_name,
        b.prod_image,
        b.prod_price
        from carts a
        inner join products b on b.prod_id = a.cart_prod_id
        where cart_fopa_id = :id
      `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const data_products = [];
    for (let a = 0; a < data_product.length; a++) {
      const data = {
        id: data_product[a].cart_id,
        qty: data_product[a].cart_qty,
        name: data_product[a].prod_name,
        image: data_product[a].prod_image,
        price: parseFloat(data_product[a].prod_price),
        total: parseInt(data_product[a].cart_qty * data_product[a].prod_price),
      };

      data_products.push(data);
    }
    const totalAll = data_products.reduce(
      (acc, current) => acc + current.total,
      0,
    );

    const data = {
      id: result.fopa_id,
      fopa_ongkir: parseInt(result.fopa_ongkir),
      fopa_payment: result.fopa_payment,
      fopa_image_transaction: result.fopa_image_transaction,
      fopa_rek: parseInt(result.fopa_rek),
      fopa_start_date: result.fopa_start_date,
      fopa_end_date: result.fopa_end_date,
      fopa_status: result.fopa_status,
      add_personal_name: result.add_personal_name,
      add_phone_number: parseInt(result.add_phone_number),
      add_address: result.add_address,
      add_village:
        'Kelurahan ' +
        village.village +
        ' ' +
        'Kecamatan ' +
        village.district +
        ' ' +
        village.city +
        ' ' +
        village.province +
        ' ' +
        village.postal,
      add_mark: result.add_mark,
      totalAll: totalAll,
      products: data_products,
    };

    await redisClient.setex('detailOrders', 60, JSON.stringify(data));

    const cachedData = await redisClient.get('detailOrders');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Detail Products (Cached)',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Detail Orders',
      data: data,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const updateStatusOrder = async (req, res) => {
  try {
    const transaction = await sequelize.transaction();
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
    const { fopa_number_resi } = req.body;

    const result = await req.context.models.form_payment.update(
      {
        fopa_status: 'orders',
        fopa_number_resi: fopa_number_resi,
      },
      {
        returning: true,
        where: { fopa_id: req.params.id },
      },
      { transaction },
    );

    await req.context.models.tracking_shipper.create(
      {
        ts_name: 'Pesanan Dikemas',
        ts_desc:
          'Penjual telah mengatur pengiriman, Menunggu pesanan diserahkan ke pihak jasa kirim',
        ts_fopa_id: req.params.id,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(200).json({
      message: 'Update Status Orders Successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const allDoneOrders = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await sequelize.query(
      `
      select 
      fopa_id as id,
      fopa_no_order_second as no_order,
      fopa_created_at as date, 
      fopa_payment as payment
      from form_payment
      where fopa_status = 'orders'
      group by 
      fopa_id,
      fopa_no_order_second,
      fopa_created_at,
      fopa_payment
      order by fopa_created_at desc;
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countResult = await sequelize.query(
      `
      select 
      count(*) as count
      from form_payment
      where fopa_status = 'orders'
      group by 
      fopa_id,
      fopa_no_order_second,
      fopa_created_at,
      fopa_payment
      order by fopa_created_at desc;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    let countFiltered = 0;
    if (countResult.length > 0) {
      countFiltered = countResult[0].count;
    }

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
      'allDoneOrders',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('allDoneOrders');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'All Done Orders (Cached)',
        data: parsedData,
        status: 200,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'All Done Orders',
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

const detailDoneOrder = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const [result] = await sequelize.query(
      `
      select 
      a.fopa_id,
      a.fopa_ongkir,
      a.fopa_payment,
      a.fopa_image_transaction,
      a.fopa_rek,
      a.fopa_start_date,
      a.fopa_end_date,
      a.fopa_status,
      b.add_personal_name,
      b.add_phone_number,
      b.add_address,
      b.add_village,
      b.add_mark
      from form_payment a
      inner join address b on b.add_user_id = a.fopa_user_id
      where (fopa_status = 'orders') 
      or (fopa_status = 'unpayment' AND fopa_payment = 'Cash on Delivery')
      and (add_mark_default = 'default')
      and fopa_id = :id;
          `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );
    const village = geografis.getVillage(result.add_village);

    const data_product = await sequelize.query(
      `
        select 
        a.cart_id,
        a.cart_qty,
        b.prod_name,
        b.prod_image,
        b.prod_price
        from carts a
        inner join products b on b.prod_id = a.cart_prod_id
        where cart_fopa_id = :id
      `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const data_products = [];
    for (let a = 0; a < data_product.length; a++) {
      const data = {
        id: data_product[a].cart_id,
        qty: data_product[a].cart_qty,
        name: data_product[a].prod_name,
        image: data_product[a].prod_image,
        price: parseFloat(data_product[a].prod_price),
        total: parseInt(data_product[a].cart_qty * data_product[a].prod_price),
      };

      data_products.push(data);
    }
    const totalAll = data_products.reduce(
      (acc, current) => acc + current.total,
      0,
    );

    const data = {
      id: result.fopa_id,
      fopa_ongkir: parseInt(result.fopa_ongkir),
      fopa_payment: result.fopa_payment,
      fopa_image_transaction: result.fopa_image_transaction,
      fopa_rek: parseInt(result.fopa_rek),
      fopa_start_date: result.fopa_start_date,
      fopa_end_date: result.fopa_end_date,
      fopa_status: result.fopa_status,
      add_personal_name: result.add_personal_name,
      add_phone_number: parseInt(result.add_phone_number),
      add_address: result.add_address,
      add_village:
        'Kelurahan ' +
        village.village +
        ' ' +
        'Kecamatan ' +
        village.district +
        ' ' +
        village.city +
        ' ' +
        village.province +
        ' ' +
        village.postal,
      add_mark: result.add_mark,
      totalAll: totalAll,
      products: data_products,
    };

    await redisClient.setex('detailDoneOrders', 60, JSON.stringify(data));

    const cachedData = await redisClient.get('detailDoneOrders');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Detail Done Orders (Cached)',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Detail Done Orders',
      data: data,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const Pickup = async (req, res) => {
  try {
    const transaction = await sequelize.transaction();
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await req.context.models.form_payment.update(
      {
        fopa_status: 'pickup courier',
      },
      {
        returning: true,
        where: { fopa_id: req.params.id },
      },
      { transaction },
    );

    await req.context.models.tracking_shipper.create(
      {
        ts_name: 'Pesanan telah diserahkan ke kurir',
        ts_desc: 'Pesanan telah diserahkan ke kurir',
        ts_fopa_id: req.params.id,
      },
      { transaction },
    );

    await transaction.commit();
    if (result[1][0] == undefined) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Updating Pickup Courier to Tracking',
      status: 200,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const listDone = async (req, res) => {
  try {
    const form_payment = await sequelize.query(
      `
        SELECT DISTINCT
          a.fopa_id AS id,
          a.fopa_ongkir AS ongkir,
          a.fopa_payment AS payment,
          a.fopa_rek AS no_rek,
          a.fopa_end_date AS end_date,
          a.fopa_status,
          a.fopa_start_date,
          a.fopa_end_date,
          a.fopa_image_transaction,
          a.fopa_no_order_first,
          a.fopa_no_order_second,
          a.fopa_image_transaction,
          a.fopa_created_at,
          a.fopa_number_resi,
          b.add_personal_name,
          b.add_phone_number,
          b.add_address,
          b.add_village,
          b.add_mark
        FROM form_payment a
        INNER JOIN address b ON b.add_user_id = a.fopa_user_id
        INNER JOIN carts c ON c.cart_fopa_id = a.fopa_id
          WHERE a.fopa_status = 'pickup courier'
          AND c.cart_status = 'done'
        ORDER BY fopa_created_at DESC
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const resultList = [];

    for (const payment of form_payment) {
      const village = geografis.getVillage(payment.add_village);

      const data_product = await sequelize.query(
        `
          SELECT
            a.cart_id,
            a.cart_qty,
            b.prod_name,
            b.prod_image,
            b.prod_price
          FROM carts a
          INNER JOIN products b ON b.prod_id = a.cart_prod_id
          WHERE cart_fopa_id = :id
        `,
        {
          replacements: { id: payment.id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      const data_products = data_product.map((item) => ({
        fopa_id: payment.id,
        id: item.cart_id,
        qty: item.cart_qty,
        name: item.prod_name,
        image: item.prod_image,
        price: item.prod_price,
        total: item.cart_qty * item.prod_price,
      }));

      const totalAll = data_products.reduce(
        (acc, current) => acc + current.total,
        0,
      );

      const data = {
        fopa_id: payment.id,
        status: payment.fopa_status,
        ongkir: payment.ongkir,
        payment: payment.payment,
        no_rek: payment.no_rek,
        start_date: payment.fopa_start_date,
        end_date: payment.fopa_end_date,
        image_transaction: payment.fopa_image_transaction,
        order_number: payment.fopa_no_order_second,
        totalAll: totalAll,
        personal_name: payment.add_personal_name,
        phone_number: payment.add_phone_number,
        address: payment.add_address,
        area: `Kelurahan ${village.village} Kecamatan ${village.district} ${village.city} ${village.province} ${village.postal}`,
        products: data_products,
      };

      let waybill = qs.stringify({
        waybill: `${payment.fopa_number_resi}`,
        courier: 'anteraja',
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.API_TRACKING_PAKET}`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          key: `${process.env.KEY_ONGKIR}`,
        },
        data: waybill,
      };

      const response = await axios(config);
      const result_waybill = response.data.rajaongkir.result;

      if (result_waybill.delivery_status.status == 'DELIVERED') {
        await redisClient.setex('listDelivery', 60, JSON.stringify(data));

        const cachedData = await redisClient.get('listDelivery');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          resultList.push(parsedData);
        } else {
          resultList.push(data);
        }
      } else {
        resultList.push({ data: 'no data' });
      }
    }

    for (let index = 0; index < resultList.length; index++) {
      if (resultList[index].data == 'no data') {
        return res.status(200).json({
          message: 'List Delivery',
          data: [],
          status: 200,
        });
      } else {
        return res.status(200).json({
          message: 'List Delivery',
          data: resultList,
          status: 200,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

export default {
  allOrders,
  detailOrder,
  updateStatusOrder,
  allDoneOrders,
  detailDoneOrder,
  Pickup,
  listDone,
};
