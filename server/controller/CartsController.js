const sequelize = require('../helpers/queryConn');
const geografis = require('geografis');
const { Op } = require('sequelize');
const moment = require('moment');
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
// const { nanoid } = require('nanoid');
// import { nanoid } from 'nanoid';

const allCart = async (req, res) => {
  try {
    const result = await req.context.models.carts.findAll({
      where: { cart_status: 'unpayment', cart_user_id: req.user.user_id },
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

    return res.status(200).json({
      message: 'Show All Carts',
      data: results,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const addCart = async (req, res) => {
  const { cart_qty, cart_prod_id } = req.body;
  try {
    const result = await req.context.models.carts.create({
      cart_qty: cart_qty,
      cart_prod_id: cart_prod_id,
      cart_user_id: req.user.user_id,
      cart_status: 'unpayment',
    });

    return res.status(200).json({
      message: 'Add Cart',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updateAddCart = async (req, res) => {
  try {
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

    return res.status(200).json({
      message: 'Update Cart',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const deleteCart = async (req, res) => {
  try {
    const result = await req.context.models.carts.destroy({
      where: { cart_id: req.params.id },
    });

    return res.status(200).json({
      message: 'Delete Cart',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const postToPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { fopa_ongkir, fopa_payment } = req.body;
    const startDate = moment().format('DD-MM-YYYY hh:mm:ss');
    const endDate = moment().add(1, 'days').format('DD-MM-YYYY hh:mm:ss');
    const date = moment().format('DDMMYY');
    const form_payment = await req.context.models.form_payment.create(
      {
        fopa_user_id: req.params.id,
        fopa_ongkir: fopa_ongkir,
        fopa_payment: fopa_payment,
        fopa_start_date: moment(startDate, 'DD-MM-YYYY hh:mm:ss'),
        fopa_end_date: moment(endDate, 'DD-MM-YYYY hh:mm:ss'),
        fopa_rek: '123456789',
        fopa_status: 'unpayment',
        fopa_no_order_second: 'SE' + date,
      },
      { transaction },
    );

    await req.context.models.carts.update(
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

    await transaction.commit();

    return res.status(200).json({
      message: 'Creating Payment',
      data: form_payment,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: error.message,
    });
  }
};

const showPayment = async (req, res) => {
  try {
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
      return res.status(200).json({
        message: 'Show form payment',
        data: result,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const checkout = async (req, res) => {
  try {
    const address = await req.context.models.address.findOne({
      where: { add_mark_default: 'default', add_user_id: req.user.user_id },
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
      where: { cart_user_id: req.user.user_id, cart_status: 'unpayment' },
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
      destination: `${kota[0].city_id}`,
      weight: `${weight}`,
      courier: 'jne',
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

    return res.status(200).json({
      message: 'Show Form Checkout',
      data: resultz,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const listUnpayment = async (req, res) => {
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
        b.cart_id,
        b.cart_qty as qty,
        c.prod_name,
        c.prod_image,
        c.prod_price
        from form_payment a
        inner join carts b on b.cart_fopa_id = a.fopa_id
        inner join products c on c.prod_id = b.cart_prod_id
        where fopa_user_id = '${req.user.user_id}'
        and a.fopa_status = 'unpayment'
        and b.cart_status = 'payment'
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const address = await req.context.models.address.findOne({
      where: {
        add_user_id: req.user.user_id,
        add_mark_default: 'default',
      },
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

    const data_cart = [];
    for (let index = 0; index < form_payment.length; index++) {
      const timeZone = 'Asia/Jakarta';
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
        data_cart.push(data);
      } else if (form_payment[index].fopa_status == 'payment') {
        const data = {
          message: 'No Data',
          data: [],
        };
        data_cart.push(data);
      } else {
        const data = {
          id: form_payment[index].cart_id,
          qty: form_payment[index].qty,
          prod_name: form_payment[index].prod_name,
          prod_image: form_payment[index].prod_image,
          prod_price: form_payment[index].prod_price,
          total: form_payment[index].qty * form_payment[index].prod_price,
        };
        data_cart.push(data);
      }
    }

    const totalAll = data_cart.reduce((acc, current) => acc + current.total, 0);

    const data_payment = {
      fopa_id: form_payment[0].id,
      status: form_payment[0].fopa_status,
      ongkir: form_payment[0].ongkir,
      payment: form_payment[0].payment,
      no_rek: form_payment[0].no_rek,
      start_date: moment
        .utc(form_payment[0].fopa_start_date)
        .format('DD-MM-YYYY HH:mm:ss'),
      end_date: moment
        .utc(form_payment[0].fopa_end_date)
        .format('DD-MM-YYYY HH:mm:ss'),
      status: form_payment[0].fopa_status,
      image_transaction: form_payment[0].fopa_image_transaction,
      order_number:
        form_payment[0].fopa_no_order_second +
        form_payment[0].fopa_no_order_first,
      totalAll: totalAll,
    };
    const data = {
      id: data_cart[0].id,
      qty: data_cart[0].qty,
      prod_name: data_cart[0].prod_name,
      prod_image: data_cart[0].prod_image,
      prod_price: data_cart[0].prod_price,
      total: data_cart[0].total,
      fopa_id: data_payment.fopa_id,
      status: data_payment.status,
      ongkir: data_payment.ongkir,
      payment: data_payment.payment,
      no_rek: data_payment.no_rek,
      start_date: data_payment.start_date,
      end_date: data_payment.end_date,
      image_transaction: data_payment.image_transaction,
      order_number: data_payment.order_number,
      totalAll: data_payment.totalAll,
      personal_name: data_address[0].personal_name,
      phone_number: data_address[0].phone_number,
      address: data_address[0].address,
      area: data_address[0].area,
    };
    const result = [data];
    return res.status(200).json({
      message: 'Show form payment',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
      data: [],
    });
  }
};

const listPayment = async (req, res) => {
  try {
    const result = await sequelize.query(
      `
        select 
        c.prod_id,
        c.prod_name as name,
        c.prod_price as price,
        c.prod_image as image,
        a.fopa_no_order_first as first_num,
        a.fopa_no_order_second as second_num,
        a.fopa_ongkir as ongkir,
        b.cart_id,
        b.cart_qty as qty,
        (b.cart_qty * c.prod_price) as total 
        from form_payment a
        left join carts b on b.cart_fopa_id = a.fopa_id 
        left join products c on c.prod_id = b.cart_prod_id
        where fopa_status = 'payment'
        and cart_status = 'done'
        and fopa_user_id = '${req.user.user_id}'
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const results = [];
    for (let index = 0; index < result.length; index++) {
      const data = {
        id_prod: result[index].prod_id,
        name: result[index].name,
        image: result[index].image,
        order_number: result[index].second_num + result[index].first_num,
        id_cart: result[index].cart_id,
        qty: result[index].qty,
        ongkir: result[index].ongkir,
        total: result[index].total,
      };
      results.push(data);
    }

    return res.status(200).json({
      message: 'List Payment',
      data: results,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const uploadPayment = async (req, res) => {
  const { files, fields } = req.fileAttrb;
  const transaction = await sequelize.transaction();
  try {
    const result = await req.context.models.form_payment.update(
      {
        fopa_image_transaction: files[0].file.originalFilename,
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

    await transaction.commit();

    return res.status(200).json({
      message: 'Upload Bukti Pembayaran',
      data: result[1][0],
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(404).json({
      message: error.message,
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

    return res.status(200).json({
      message: 'All Orders',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const detailAllOrdersAdmin = async (req, res) => {
  try {
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
      });
    } else if (form_payment[0].fopa_status == 'payment') {
      return res.status(200).json({
        message: 'No Data',
      });
    } else {
      const result = { data_address, form_payment };
      return res.status(200).json({
        message: 'Show form payment',
        data: result,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const detailPaymentAdmin = async (req, res) => {
  try {
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
      });
    } else if (form_payment[0].fopa_status == 'payment') {
      return res.status(200).json({
        message: 'No Data',
      });
    } else {
      const result = { data_address, form_payment };
      return res.status(200).json({
        message: 'Show form payment',
        data: result,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const detailPayment = async (req, res) => {
  try {
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
        where cart_id = :id
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

    const data_shipment = {};

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

    const result = { data_address, data_shipment, data_product, data_payment };

    return res.status(200).json({
      message: 'Detail Payment',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const listCancel = async (req, res) => {
  try {
    const result = await sequelize.query(
      `
        select 
        c.prod_id,
        c.prod_name as name,
        c.prod_price as price,
        c.prod_image as image,
        a.fopa_no_order_first as first_num,
        a.fopa_no_order_second as second_num,
        b.cart_id,
        b.cart_qty as qty,
        (b.cart_qty * c.prod_price) as total 
        from form_payment a
        left join carts b on b.cart_fopa_id = a.fopa_id 
        left join products c on c.prod_id = b.cart_prod_id
        where fopa_status = 'cancel'
        and cart_status = 'payment'
        and fopa_user_id = '${req.user.user_id}'
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const results = [];
    for (let index = 0; index < result.length; index++) {
      const data = {
        id_prod: result[index].prod_id,
        name: result[index].name,
        image: result[index].image,
        order_number: result[index].second_num + result[index].first_num,
        id_cart: result[index].cart_id,
        qty: result[index].qty,
        total: result[index].total,
      };
      results.push(data);
    }

    return res.status(200).json({
      message: 'List Cancel',
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const sendCancel = async (req, res) => {
  try {
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
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
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
};
