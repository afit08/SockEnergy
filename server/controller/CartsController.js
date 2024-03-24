const sequelize = require('../helpers/queryConn');
const geografis = require('geografis');
const { Op } = require('sequelize');
const moment = require('moment');
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
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
const { body, validationResult } = require('express-validator');
const uuidv4 = require('uuid');

const createValidationRules = [
  body('fopa_ongkir').notEmpty().escape().withMessage('PayShipper is required'),
  body('fopa_payment').notEmpty().escape().withMessage('Payment is required'),
  body('fopa_desc_ongkir')
    .notEmpty()
    .escape()
    .withMessage('Description PayShipper is required'),
  body('fopa_etd_ongkir').notEmpty().escape().withMessage('ETD is required'),
];

const createValidationAddCart = [
  body('cart_qty').notEmpty().escape().withMessage('Cart QTY is required'),
  body('cart_prod_id')
    .notEmpty()
    .escape()
    .withMessage('Cart Product ID is required'),
];

const allCart = async (req, res) => {
  try {
    const result = await req.context.models.carts.findAll({
      where: { cart_status: 'unpayment', cart_user_id: req.user.user_id },
      order: [['cart_created_at', 'desc']],
      include: [
        {
          model: req.context.models.products,
          as: 'cart_prod',
          attributes: ['prod_name', 'prod_image', 'prod_price'],
        },
      ],
    });

    const coba = [];
    for (let index = 0; index < result.length; index++) {
      const count = result[index].cart_prod.prod_price * result[index].cart_qty;
      const data = {
        total: count,
      };
      coba.push(data);
    }
    const sum = coba.reduce((acc, current) => acc + current.total, 0);

    const results = { result, sum };

    await redisClient.setex('allCarts', 60, JSON.stringify(results));

    const cachedData = await redisClient.get('allCarts');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'All Carts (Cached)',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Show All Carts',
      data: results,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const addCart = async (req, res) => {
  try {
    await Promise.all(
      createValidationAddCart.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { cart_qty, cart_prod_id } = req.body;

    const result = await req.context.models.carts.create({
      cart_qty: cart_qty,
      cart_prod_id: cart_prod_id,
      cart_user_id: req.user.user_id,
      cart_status: 'unpayment',
    });

    return res.status(200).json({
      message: 'Add Cart Successfully!!!',
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

const updateAddCart = async (req, res) => {
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
    const { cart_qty } = req.body;

    const result = await req.context.models.carts.update(
      {
        cart_qty: cart_qty,
      },
      {
        returning: true,
        where: { cart_id: req.params.id },
      },
    );

    if (result[1][0] == undefined) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Update Cart Successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const deleteCart = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);
    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await req.context.models.carts.destroy({
      where: { cart_id: req.params.id },
    });

    return res.status(200).json({
      message: 'Delete Cart',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const postToPayment = async (req, res) => {
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
    const transaction = await sequelize.transaction();
    const { fopa_ongkir, fopa_payment, fopa_desc_ongkir, fopa_etd_ongkir } =
      req.body;
    const startDate = moment().format('DD-MM-YYYY hh:mm:ss');
    const endDate = moment().add(1, 'days').format('DD-MM-YYYY hh:mm:ss');
    const date = moment().format('DDMMYY');
    const randomNo = Math.floor(Math.random() * 10000);

    const form_payment = await req.context.models.form_payment.create(
      {
        fopa_user_id: req.params.id,
        fopa_ongkir: fopa_ongkir,
        fopa_payment: fopa_payment,
        fopa_desc_ongkir: fopa_desc_ongkir,
        fopa_etd_ongkir: fopa_etd_ongkir,
        fopa_start_date: moment(startDate, 'DD-MM-YYYY hh:mm:ss'),
        fopa_end_date: moment(endDate, 'DD-MM-YYYY hh:mm:ss'),
        fopa_rek: '123456789',
        fopa_status: 'unpayment',
        fopa_no_order_second: 'SE' + date + randomNo,
      },
      { transaction },
    );

    const cart = await req.context.models.carts.update(
      {
        cart_status: 'payment',
        cart_fopa_id: form_payment.fopa_id,
      },
      {
        returning: true,
        where: { cart_user_id: req.params.id, cart_status: 'unpayment' },
      },
      { transaction },
    );

    await req.context.models.tracking_shipper.create(
      {
        ts_name: 'Pesanan Dibuat',
        ts_desc: 'Pesanan Dibuat',
        ts_fopa_id: form_payment.fopa_id,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(200).json({
      message: 'Creating Payment Successfully!!!',
      status: 200,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const showPayment = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);
    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const form_payment = await req.context.models.form_payment.findOne({
      where: {
        fopa_user_id: req.params.id,
        fopa_status: 'unpayment',
      },
    });

    const cart = await req.context.models.carts.findAll({
      where: {
        cart_user_id: form_payment.fopa_user_id,
        cart_status: 'payment',
      },
      include: [
        {
          model: req.context.models.products,
          as: 'cart_prod',
          attributes: [
            'prod_name',
            'prod_image',
            'prod_price',
            'prod_desc',
            'prod_stock',
          ],
        },
      ],
    });

    const data_cart = [];
    for (let index = 0; index < cart.length; index++) {
      const data = {
        cart_id: cart[index].cart_id,
        cart_qty: cart[index].cart_qty,
        cart_prod_id: cart[index].cart_id,
        cart_status: cart[index].cart_status,
        cart_user_id: cart[index].cart_user_id,
        cart_fopa_id: cart[index].cart_fopa_id,
        prod_name: cart[index].cart_prod.prod_name,
        prod_image: cart[index].cart_prod.prod_image,
        prod_price: cart[index].cart_prod.prod_price,
        prod_desc: cart[index].cart_prod.prod_desc,
        prod_stock: cart[index].cart_prod.prod_stock,
        total: cart[index].cart_qty * cart[index].cart_prod.prod_price,
      };
      data_cart.push(data);
    }

    const totalAll = data_cart.reduce((acc, current) => acc + current.total, 0);

    const address = await req.context.models.address.findOne({
      where: { add_user_id: req.params.id, add_mark_default: 'default' },
    });

    const timeZone = 'Asia/Jakarta';

    const ongkir = form_payment.fopa_ongkir;
    const payment = form_payment.fopa_payment;
    const no_rek = form_payment.fopa_rek;
    const start_date = moment
      .utc(form_payment.fopa_start_date)
      .format('DD-MM-YYYY HH:mm:ss');
    const end_date = moment
      .utc(form_payment.fopa_end_date)
      .format('DD-MM-YYYY HH:mm:ss');
    const status = form_payment.fopa_status;
    const image_transaction = form_payment.fopa_image_transaction;
    const order_number =
      form_payment.fopa_no_order_second + form_payment.fopa_no_order_first;

    const village = geografis.getVillage(address.add_village);

    const data_address = [
      {
        personal_name: address.add_personal_name,
        phone_number: address.add_phone_number,
        address: address.add_address,
        area:
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
      },
    ];

    const startDate = moment.utc().format('DD-MM-YYYY HH:mm:ss');
    const endDate = moment
      .utc(form_payment.fopa_end_date)
      .format('DD-MM-YYYY HH:mm:ss');
    if (startDate >= endDate) {
      const cancel = await req.context.models.form_payment.update(
        {
          fopa_status: 'cancel',
        },
        { where: { fopa_status: 'unpayment', fopa_user_id: req.user.user_id } },
      );
      return res.status(200).json({
        message: 'Send Cancel',
        data: cancel,
      });
    } else if (form_payment.fopa_status == 'payment') {
      return res.status(200).json({
        message: 'No Data',
        data: [],
        status: 200,
      });
    } else {
      const result = {
        data_address,
        data_cart,
        ongkir,
        payment,
        no_rek,
        start_date,
        end_date,
        status,
        image_transaction,
        order_number,
        totalAll,
      };

      await redisClient.setex('showFormPayment', 60, JSON.stringify(result));

      const cachedData = await redisClient.get('showFormPayment');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        return res.status(200).json({
          message: 'Show Form Payment (Cached)',
          data: parsedData,
        });
      }

      return res.status(200).json({
        message: 'Show form payment',
        data: result,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const checkout = async (req, res) => {
  try {
    const address = await req.context.models.address.findOne({
      where: { add_mark_default: 'default', add_user_id: req.params.id },
    });

    const village = geografis.getVillage(address.add_village);

    const data_address = [
      {
        personal_name: address.add_personal_name,
        phone_number: address.add_phone_number,
        address: address.add_address,
        area:
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
      },
    ];

    //   Data Payment
    const data_payment = await req.context.models.payment_method.findAll({});
    const cart = await req.context.models.carts.findAll({
      where: { cart_user_id: req.params.id, cart_status: 'unpayment' },
      include: [
        {
          model: req.context.models.products,
          as: 'cart_prod',
          attributes: [
            'prod_name',
            'prod_image',
            'prod_price',
            'prod_desc',
            'prod_weight',
          ],
        },
      ],
    });

    const data_cart = [];
    for (let index = 0; index < cart.length; index++) {
      const count = cart[index].cart_prod.prod_price * cart[index].cart_qty;
      const weight =
        parseInt(cart[index].cart_prod.prod_weight) * cart[index].cart_qty;

      const data = {
        image: cart[index].cart_prod.prod_image,
        name: cart[index].cart_prod.prod_name,
        desc: cart[index].cart_prod.prod_desc,
        price: cart[index].cart_prod.prod_price,
        qty: cart[index].cart_qty,
        total: count,
        weight: weight,
      };
      data_cart.push(data);
    }
    const subtotal = data_cart.reduce((acc, current) => acc + current.total, 0);
    const weight = data_cart.reduce((acc, current) => acc + current.weight, 0);

    // API Province RO
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${process.env.API_PROVINCE}`,
      headers: {
        key: `${process.env.KEY_ONGKIR}`,
      },
    };

    const response = await axios(config);
    const province = response.data.rajaongkir.results;

    const prov = [];
    for (let index = 0; index < province.length; index++) {
      if (province[index].province === village.province) {
        const data = {
          id: province[index].province_id,
          name: province[index].province,
        };
        prov.push(data);
      }
    }
    const cities = await req.context.models.dt2.findOne({
      where: { id: address.add_city },
    });

    // API City RO
    let configs = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${process.env.API_CITY}?province=${prov[0].id}`,
      headers: {
        key: `${process.env.KEY_ONGKIR}`,
      },
    };
    const responses = await axios(configs);
    const city = responses.data.rajaongkir.results;

    const kota = [];
    const datas = city;
    for (let a = 0; a < datas.length; a++) {
      if (cities.nm === datas[a].city_name) {
        const data = {
          city_id: datas[a].city_id,
        };
        kota.push(data);
      }
    }

    let data = qs.stringify({
      origin: '115',
      originType: 'city',
      destination: `${kota[0].city_id}`,
      destinationType: 'city',
      weight: `${weight}`,
      courier: 'anteraja',
    });

    let cost = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${process.env.API_COST}`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        key: `${process.env.KEY_ONGKIR}`,
      },
      data: data,
    };

    const responsez = await axios(cost);
    const ongkir = responsez.data.rajaongkir.results;

    const data_ongkir = ongkir[0].costs;
    const data_ongkirs = [];
    for (let a = 0; a < data_ongkir.length; a++) {
      const cost = data_ongkir[a].cost;
      for (let b = 0; b < cost.length; b++) {
        const data = {
          service: data_ongkir[a].service,
          description: data_ongkir[a].description,
          value: cost[b].value,
          etd: cost[b].etd,
          note: cost[b].note,
        };
        data_ongkirs.push(data);
      }
    }

    const resultz = [];
    if (cart[0].cart_status == 'unpayment') {
      const results = {
        data_address,
        data_ongkirs,
        data_payment,
        data_cart,
        subtotal,
      };
      resultz.push(results);
    }

    await redisClient.setex('showFormCheckout', 60, JSON.stringify(resultz));

    const cachedData = await redisClient.get('showFormCheckout');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show Form Checkout (Cached)',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Show Form Checkout',
      data: resultz,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const listUnpayment = async (req, res) => {
  const form_payment = await sequelize.query(
    `
      select
      distinct
      a.fopa_id as id,
      a.fopa_ongkir as ongkir,
      a.fopa_payment as payment,
      a.fopa_rek as no_rek,
      a.fopa_end_date as end_date,
      a.fopa_status,
      a.fopa_start_date,
      a.fopa_end_date,
      a.fopa_image_transaction,
      a.fopa_no_order_first,
      a.fopa_no_order_second,
      a.fopa_image_transaction,
      a.fopa_created_at,
      b.add_personal_name,
      b.add_phone_number,
      b.add_address,
      b.add_village,
      b.add_mark
      from form_payment a
      inner join address b on b.add_user_id = a.fopa_user_id
      inner join carts c on c.cart_fopa_id = a.fopa_id
      where fopa_user_id = '${req.user.user_id}'
      and a.fopa_status = 'unpayment'
      and c.cart_status = 'payment'
      order by fopa_created_at DESC
    `,
    {
      type: sequelize.QueryTypes.SELECT,
    },
  );

  const result = [];
  for (let index = 0; index < form_payment.length; index++) {
    const village = geografis.getVillage(form_payment[index].add_village);
    // const timeZone = 'Asia/Jakarta';
    const startDate = moment.utc().format('DD-MM-YYYY HH:mm:ss');
    const endDate = moment
      .utc(form_payment[index].end_date)
      .format('DD-MM-YYYY HH:mm:ss');

    if (startDate >= endDate) {
      const cancel = await req.context.models.form_payment.update(
        {
          fopa_status: 'cancel',
        },
        {
          where: { fopa_status: 'unpayment', fopa_user_id: req.user.user_id },
        },
      );
      const data = {
        message: 'Send Cancel',
        data: cancel,
      };
      result.push(data);
    } else if (form_payment[index].fopa_status == 'payment') {
      const data = {
        message: 'No Data',
        data: [],
        status: 200,
      };
      result.push(data);
    } else {
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
          replacements: { id: form_payment[index].id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      const data_products = [];
      for (let a = 0; a < data_product.length; a++) {
        const data = {
          fopa_id: form_payment[index].id,
          id: data_product[a].cart_id,
          qty: data_product[a].cart_qty,
          name: data_product[a].prod_name,
          image: data_product[a].prod_image,
          price: data_product[a].prod_price,
          total: data_product[a].cart_qty * data_product[a].prod_price,
        };

        data_products.push(data);
      }
      const totalAll = data_products.reduce(
        (acc, current) => acc + current.total,
        0,
      );
      if (form_payment[index].payment == 'Cash on Delivery') {
        const data = {
          fopa_id: form_payment[index].id,
          status: form_payment[index].fopa_status,
          ongkir: form_payment[index].ongkir,
          payment: 'Waiting Confirm',
          no_rek: form_payment[index].no_rek,
          start_date: form_payment[index].fopa_start_date,
          end_date: form_payment[index].fopa_end_date,
          image_transaction: form_payment[index].fopa_image_transaction,
          order_number: form_payment[index].fopa_no_order_second,
          totalAll: totalAll,
          personal_name: form_payment[index].add_personal_name,
          phone_number: form_payment[index].add_phone_number,
          address: form_payment[index].add_address,
          area:
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
          products: data_products,
        };
        result.push(data);
      } else {
        const data = {
          fopa_id: form_payment[index].id,
          status: form_payment[index].fopa_status,
          ongkir: form_payment[index].ongkir,
          payment: form_payment[index].payment,
          no_rek: form_payment[index].no_rek,
          start_date: form_payment[index].fopa_start_date,
          end_date: form_payment[index].fopa_end_date,
          image_transaction: form_payment[index].fopa_image_transaction,
          order_number: form_payment[index].fopa_no_order_second,
          totalAll: totalAll,
          personal_name: form_payment[index].add_personal_name,
          phone_number: form_payment[index].add_phone_number,
          address: form_payment[index].add_address,
          area:
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
          products: data_products,
        };
        result.push(data);
      }
    }
  }

  await redisClient.setex('listUnpayment', 60, JSON.stringify(result));

  const cachedData = await redisClient.get('listUnpayment');
  if (cachedData) {
    const parsedData = JSON.parse(cachedData);
    return res.status(200).json({
      message: 'List Unpayment (Cached)',
      data: parsedData,
      status: 200,
    });
  }

  return res.status(200).json({
    message: 'List Unpayment',
    data: result,
    status: 200,
  });
};

const listPayment = async (req, res) => {
  try {
    const form_payment = await sequelize.query(
      `
      select
      distinct
      a.fopa_id as id,
      a.fopa_ongkir as ongkir,
      a.fopa_payment as payment,
      a.fopa_rek as no_rek,
      a.fopa_end_date as end_date,
      a.fopa_status,
      a.fopa_start_date,
      a.fopa_end_date,
      a.fopa_image_transaction,
      a.fopa_no_order_first,
      a.fopa_no_order_second,
      a.fopa_image_transaction,
      a.fopa_created_at,
      b.add_personal_name,
      b.add_phone_number,
      b.add_address,
      b.add_village,
      b.add_mark
      from form_payment a
      inner join address b on b.add_user_id = a.fopa_user_id
      inner join carts c on c.cart_fopa_id = a.fopa_id
      where fopa_user_id = '${req.user.user_id}'
      and a.fopa_status = 'payment'
      and c.cart_status = 'done'
      order by fopa_created_at DESC
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const result = [];
    for (let index = 0; index < form_payment.length; index++) {
      const village = geografis.getVillage(form_payment[index].add_village);
      // const timeZone = 'Asia/Jakarta';
      const startDate = moment.utc().format('DD-MM-YYYY HH:mm:ss');
      const endDate = moment
        .utc(form_payment[index].end_date)
        .format('DD-MM-YYYY HH:mm:ss');

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
          replacements: { id: form_payment[index].id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      const data_products = [];
      for (let a = 0; a < data_product.length; a++) {
        const data = {
          fopa_id: form_payment[index].id,
          id: data_product[a].cart_id,
          qty: data_product[a].cart_qty,
          name: data_product[a].prod_name,
          image: data_product[a].prod_image,
          price: data_product[a].prod_price,
          total: data_product[a].cart_qty * data_product[a].prod_price,
        };

        data_products.push(data);
      }
      const totalAll = data_products.reduce(
        (acc, current) => acc + current.total,
        0,
      );

      const data = {
        fopa_id: form_payment[index].id,
        status: form_payment[index].fopa_status,
        ongkir: form_payment[index].ongkir,
        payment: form_payment[index].payment,
        no_rek: form_payment[index].no_rek,
        start_date: form_payment[index].fopa_start_date,
        end_date: form_payment[index].fopa_end_date,
        image_transaction: form_payment[index].fopa_image_transaction,
        order_number: form_payment[index].fopa_no_order_second,
        totalAll: totalAll,
        personal_name: form_payment[index].add_personal_name,
        phone_number: form_payment[index].add_phone_number,
        address: form_payment[index].add_address,
        area:
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
        products: data_products,
      };

      result.push(data);
    }

    await redisClient.setex('listPayment', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('listPayment');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'List Payment (Cached)',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'List Payment',
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

const uploadPayment = async (req, res) => {
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

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    await new Promise((resolve, reject) => {
      minioClient.putObject(
        'sock-energy',
        fileName,
        fileBuffer,
        (err, etag) => {
          if (err) {
            reject(err);
          } else {
            resolve(etag);
          }
        },
      );
    });

    const result = await req.context.models.form_payment.update(
      {
        fopa_image_transaction: fileName,
        fopa_status: 'payment',
      },
      {
        returning: true,
        where: { fopa_id: req.params.id },
      },
      { transaction },
    );

    await req.context.models.carts.update(
      {
        cart_status: 'done',
      },
      {
        where: {
          cart_user_id: req.user.user_id,
          cart_status: 'payment',
          cart_fopa_id: req.params.id,
        },
      },
      { transaction },
    );

    await req.context.models.tracking_shipper.create(
      {
        ts_name: 'Bukti Pembayaran Telah Berhasil Diupload',
        ts_desc: 'Bukti Pembayaran Telah Berhasil Diupload',
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
      message: 'Upload Bukti Pembayaran Successfully!!!',
      status: 200,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const allOrders = async (req, res) => {
  try {
    const result = await sequelize.query(
      `
      select
      distinct
      a.fopa_ongkir as ongkir,
      a.fopa_payment as payment,
      a.fopa_rek as no_rek,
      a.fopa_end_date as end_date,
      a.fopa_user_id as user,
      a.fopa_status as status,
      b.cart_qty as qty,
      c.prod_name,
      c.prod_image,
      c.prod_price,
      c.prod_desc,
      c.prod_stock
      from form_payment a
      left join carts b on b.cart_fopa_id = a.fopa_id
      left join products c on c.prod_id = b.cart_prod_id
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    await redisClient.setex('allOrders', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('allOrders');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'All Orders (Cached)',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'All Orders',
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

const detailAllOrdersAdmin = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const form_payment = await sequelize.query(
      `
      select
      distinct
      a.fopa_ongkir as ongkir,
      a.fopa_payment as payment,
      a.fopa_rek as no_rek,
      a.fopa_end_date as end_date,
      b.cart_qty as qty,
      c.prod_name,
      c.prod_image,
      c.prod_price,
      c.prod_desc,
      c.prod_stock
      from form_payment a
      left join carts b on b.cart_fopa_id = a.fopa_id
      left join products c on c.prod_id = b.cart_prod_id
      where a.fopa_user_id = :id
      `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const address = await req.context.models.address.findOne({
      where: { add_user_id: req.params.id, add_mark_default: 'default' },
    });

    const village = geografis.getVillage(address.add_village);

    const data_address = [
      {
        personal_name: address.add_personal_name,
        phone_number: address.add_phone_number,
        address: address.add_address,
        area:
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
      },
    ];

    const timeZone = 'Asia/Jakarta';
    const startDate = moment.utc().format('DD-MM-YYYY HH:mm:ss');
    const endDate = moment
      .utc(form_payment[0].end_date)
      .format('DD-MM-YYYY HH:mm:ss');

    if (startDate >= endDate) {
      return res.status(200).json({
        message: 'No Data',
        status: 200,
      });
    } else if (form_payment[0].fopa_status == 'payment') {
      return res.status(200).json({
        message: 'No Data',
        status: 200,
      });
    } else {
      const result = { data_address, form_payment };
      await redisClient.setex('showFormPayment', 60, JSON.stringify(result));

      const cachedData = await redisClient.get('showFormPayment');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        return res.status(200).json({
          message: 'Show Form Payment (Cached)',
          data: parsedData,
          status: 200,
        });
      }
      return res.status(200).json({
        message: 'Show Form Payment',
        data: result,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const detailPaymentAdmin = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const form_payment = await sequelize.query(
      `
      select
      distinct
      a.fopa_ongkir as ongkir,
      a.fopa_payment as payment,
      a.fopa_rek as no_rek,
      a.fopa_end_date as end_date,
      b.cart_qty as qty,
      c.prod_name,
      c.prod_image,
      c.prod_price,
      c.prod_desc,
      c.prod_stock
      from form_payment a
      left join carts b on b.cart_fopa_id = a.fopa_id
      left join products c on c.prod_id = b.cart_prod_id
      where a.fopa_user_id = :id
      and a.fopa_status = 'unpayment' 
      and b.cart_status = 'payment'
      `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const address = await req.context.models.address.findOne({
      where: { add_user_id: req.params.id, add_mark_default: 'default' },
    });

    const village = geografis.getVillage(address.add_village);

    const data_address = [
      {
        personal_name: address.add_personal_name,
        phone_number: address.add_phone_number,
        address: address.add_address,
        area:
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
      },
    ];

    const timeZone = 'Asia/Jakarta';
    const startDate = moment.utc().format('DD-MM-YYYY HH:mm:ss');
    const endDate = moment
      .utc(form_payment[0].end_date)
      .format('DD-MM-YYYY HH:mm:ss');

    if (startDate >= endDate) {
      return res.status(200).json({
        message: 'No Data',
        status: 200,
      });
    } else if (form_payment[0].fopa_status == 'payment') {
      return res.status(200).json({
        message: 'No Data',
        status: 200,
      });
    } else {
      const result = { data_address, form_payment };

      await redisClient.setex('detailPaymentAdmin', 60, JSON.stringify(result));

      const cachedData = await redisClient.get('detailPaymentAdmin');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        return res.status(200).json({
          message: 'All Done Orders (Cached)',
          data: parsedData,
        });
      }
      return res.status(200).json({
        message: 'Show form payment',
        data: result,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const detailPayment = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const [data] = await sequelize.query(
      `
        select 
        c.add_personal_name,
        c.add_phone_number,
        c.add_village,
        c.add_address,
        a.cart_qty as product_qty,
        a.cart_status as status,
        d.prod_id as product_id,
        d.prod_name as product_name,
        d.prod_image as product_image,
        d.prod_price as product_price,
        e.fopa_id,
        e.fopa_desc_ongkir as ongkir_name,
        e.fopa_etd_ongkir as ongkir_etd,
        e.fopa_number_resi as resi,
        e.fopa_ongkir as ongkir_cost,
        e.fopa_payment as ongkir_payment,
        e.fopa_image_transaction as bukti,
        e.fopa_status as payment_status,
        e.fopa_no_order_first as first,
        e.fopa_no_order_second as second
        from carts a
        left join users b on b.user_id = a.cart_user_id 
        left join address c on c.add_user_id = b.user_id
        left join products d on d.prod_id = a.cart_prod_id
        left join form_payment e on e.fopa_id = a.cart_fopa_id
        where fopa_id = :id
      `,
      {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const village = geografis.getVillage(data.add_village);
    const data_address = {
      personal_name: data.add_personal_name,
      phone_number: data.add_phone_number,
      address: data.add_address,
      area:
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
    };

    if (data.resi == null) {
      const shipper = await req.context.models.tracking_shipper.findAll({
        where: { ts_fopa_id: req.params.id },
      });

      const tracking_data = [];
      for (let index = 0; index < shipper.length; index++) {
        const datetimes = shipper[index].ts_date + ' ' + shipper[index].ts_time;
        const data = {
          name: shipper[index].ts_name,
          desc: shipper[index].ts_desc,
          datetime: moment(datetimes).format('YYYY-MM-DD HH:mm:ss'),
        };
        tracking_data.push(data);
      }
      const tracking = [...tracking_data];

      const data_waybill = {
        courier_name: data.ongkir_name,
        number_resi: data.resi,
        estimasi: data.ongkir_etd,
        tracking: tracking.sort((p1, p2) =>
          p1.datetime > p2.datetime ? 1 : p1.datetime < p2.datetime ? -1 : 0,
        ),
      };

      const data_shipment = { data_waybill };

      const data_product = {
        id: data.product_id,
        name: data.product_name,
        image: data.product_image,
        price: data.product_price,
        qty: data.product_qty,
        status: data.status,
        total: data.product_price * data.product_qty,
      };

      function sum(obj) {
        var sum = 0;
        for (var el in obj) {
          if (obj.hasOwnProperty(el)) {
            sum += parseFloat(obj[el]);
          }
        }
        return sum;
      }

      const data_total = {
        total: data.product_price * data.product_qty,
      };

      const data_payment = {
        ongkir: data.ongkir_cost,
        payment_method: data.ongkir_payment,
        bukti: data.bukti,
        status: data.payment_status,
        totalAll: sum(data_total) + parseInt(data.ongkir_cost),
        order_number: data.second + data.first,
      };

      const result = {
        data_address,
        data_shipment,
        data_product,
        data_payment,
      };

      await redisClient.setex('detailPayment', 60, JSON.stringify(result));

      const cachedData = await redisClient.get('detailPayment');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        return res.status(200).json({
          message: 'Detail Payment (Cached)',
          data: parsedData,
          status: 200,
        });
      }

      return res.status(200).json({
        message: 'Detail Payment',
        data: result,
        status: 200,
      });
    } else {
      let waybill = qs.stringify({
        waybill: `${data.resi}`,
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

      const data_tracking = [];
      const track = result_waybill.manifest;
      for (let index = 0; index < track.length; index++) {
        const data = {
          name: track[index].city_name,
          desc: track[index].manifest_description,
          datetime:
            track[index].manifest_date + ' ' + track[index].manifest_time,
        };

        data_tracking.push(data);
      }

      const shipper = await req.context.models.tracking_shipper.findAll({
        where: { ts_fopa_id: req.params.id },
      });

      const tracking_data = [];
      for (let index = 0; index < shipper.length; index++) {
        const datetimes = shipper[index].ts_date + ' ' + shipper[index].ts_time;
        const data = {
          name: shipper[index].ts_name,
          desc: shipper[index].ts_desc,
          datetime: moment(datetimes).format('YYYY-MM-DD HH:mm:ss'),
        };

        tracking_data.push(data);
      }
      const tracking = [...tracking_data, ...data_tracking];

      const data_waybill = {
        courier_name: result_waybill.summary.courier_name,
        number_resi: result_waybill.summary.waybill_number,
        estimasi: data.ongkir_etd,
        tracking: tracking.sort((p1, p2) =>
          p1.datetime > p2.datetime ? 1 : p1.datetime < p2.datetime ? -1 : 0,
        ),
      };

      const data_shipment = { data_waybill };

      const data_product = {
        id: data.product_id,
        name: data.product_name,
        image: data.product_image,
        price: data.product_price,
        qty: data.product_qty,
        status: data.status,
        total: data.product_price * data.product_qty,
      };

      function sum(obj) {
        var sum = 0;
        for (var el in obj) {
          if (obj.hasOwnProperty(el)) {
            sum += parseFloat(obj[el]);
          }
        }
        return sum;
      }

      const data_total = {
        total: data.product_price * data.product_qty,
      };

      const data_payment = {
        ongkir: data.ongkir_cost,
        payment_method: data.ongkir_payment,
        bukti: data.bukti,
        status: data.payment_status,
        totalAll: sum(data_total) + parseInt(data.ongkir_cost),
        order_number: data.second + data.first,
      };

      const result = {
        data_address,
        data_shipment,
        data_product,
        data_payment,
      };

      await redisClient.setex('detailPayment', 60, JSON.stringify(result));

      const cachedData = await redisClient.get('detailPayment');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        return res.status(200).json({
          message: 'Detail Payment (Cached)',
          data: parsedData,
          status: 200,
        });
      }

      return res.status(200).json({
        message: 'Detail Payment',
        data: result,
        status: 200,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const listCancel = async (req, res) => {
  try {
    const form_payment = await sequelize.query(
      `
      select
      distinct
      a.fopa_id as id,
      a.fopa_ongkir as ongkir,
      a.fopa_payment as payment,
      a.fopa_rek as no_rek,
      a.fopa_end_date as end_date,
      a.fopa_status,
      a.fopa_start_date,
      a.fopa_end_date,
      a.fopa_image_transaction,
      a.fopa_no_order_first,
      a.fopa_no_order_second,
      a.fopa_image_transaction,
      a.fopa_created_at,
      b.add_personal_name,
      b.add_phone_number,
      b.add_address,
      b.add_village,
      b.add_mark
      from form_payment a
      inner join address b on b.add_user_id = a.fopa_user_id
      inner join carts c on c.cart_fopa_id = a.fopa_id
      where fopa_user_id = '${req.user.user_id}'
      and fopa_status = 'cancel'
      and cart_status = 'payment'
      order by fopa_created_at DESC
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (form_payment.length === 0) {
      return res.status(404).json({
        message: 'Not Found',
        status: 404,
        data: [],
      });
    } else {
    }

    const result = [];
    for (let index = 0; index < form_payment.length; index++) {
      const village = geografis.getVillage(form_payment[index].add_village);
      // const timeZone = 'Asia/Jakarta';
      const startDate = moment.utc().format('DD-MM-YYYY HH:mm:ss');
      const endDate = moment
        .utc(form_payment[index].end_date)
        .format('DD-MM-YYYY HH:mm:ss');

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
          replacements: { id: form_payment[index].id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      const data_products = [];
      for (let a = 0; a < data_product.length; a++) {
        const data = {
          fopa_id: form_payment[index].id,
          id: data_product[a].cart_id,
          qty: data_product[a].cart_qty,
          name: data_product[a].prod_name,
          image: data_product[a].prod_image,
          price: data_product[a].prod_price,
          total: data_product[a].cart_qty * data_product[a].prod_price,
        };

        data_products.push(data);
      }
      const totalAll = data_products.reduce(
        (acc, current) => acc + current.total,
        0,
      );

      const data = {
        fopa_id: form_payment[index].id,
        status: form_payment[index].fopa_status,
        ongkir: form_payment[index].ongkir,
        payment: form_payment[index].payment,
        no_rek: form_payment[index].no_rek,
        start_date: form_payment[index].fopa_start_date,
        end_date: form_payment[index].fopa_end_date,
        image_transaction: form_payment[index].fopa_image_transaction,
        order_number: form_payment[index].fopa_no_order_second,
        totalAll: totalAll,
        personal_name: form_payment[index].add_personal_name,
        phone_number: form_payment[index].add_phone_number,
        address: form_payment[index].add_address,
        area:
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
        products: data_products,
      };

      result.push(data);
    }

    await redisClient.setex('listCancel', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('listCancel');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'List Cancel (Cached)',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'List Cancel',
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

const sendCancel = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await req.context.models.form_payment.update(
      {
        fopa_status: 'cancel',
      },
      {
        return: true,
        where: { fopa_id: req.params.id, fopa_user_id: req.user.user_id },
      },
    );

    return res.status(200).json({
      message: 'Send Cancel',
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

const listDelivery = async (req, res) => {
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
        WHERE fopa_user_id = :userId
          AND a.fopa_status = 'pickup courier'
          AND c.cart_status = 'done'
        ORDER BY fopa_created_at DESC
      `,
      {
        replacements: { userId: req.user.user_id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (form_payment.length === 0) {
      return res.status(404).json({
        message: 'Not Found',
        status: 404,
        data: [],
      });
    } else {
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
          resultList.push({ data: 'no data' });
        } else {
          await redisClient.setex('listDelivery', 60, JSON.stringify(data));

          const cachedData = await redisClient.get('listDelivery');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            resultList.push(parsedData);
          } else {
            resultList.push(data);
          }
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
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
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
        WHERE fopa_user_id = :userId
          AND a.fopa_status = 'pickup courier'
          AND c.cart_status = 'done'
        ORDER BY fopa_created_at DESC
      `,
      {
        replacements: { userId: req.user.user_id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (form_payment.length === 0) {
      return res.status(404).json({
        message: 'Not Found',
        status: 404,
        data: [],
      });
    } else {
      const resultList = [];

      for (const payment of form_payment) {
        const village = geografis.getVillage(payment.add_village);
        console.log(village);
        const data_product = await sequelize.query(
          `
          SELECT
            a.cart_id,
            a.cart_qty,
            b.prod_id,
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

        console.log(data_product);

        const data_products = data_product.map((item) => ({
          fopa_id: payment.id,
          id: item.cart_id,
          prod_id: item.prod_id,
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

        console.log(payment.fopa_number_resi);

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
        console.log(result_waybill.delivery_status.status);
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
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

export default {
  allCart,
  addCart,
  postToPayment,
  showPayment,
  checkout,
  updateAddCart,
  deleteCart,
  listPayment,
  listUnpayment,
  uploadPayment,
  allOrders,
  detailAllOrdersAdmin,
  detailPaymentAdmin,
  detailPayment,
  listCancel,
  sendCancel,
  listDelivery,
  listDone,
};
