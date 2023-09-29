const sequelize = require('../helpers/queryConn');
const geografis = require('geografis');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');

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
    const timeZone = 'Asia/Jakarta';
    const startDate = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
    const endDate = moment()
      .add(1, 'days')
      .tz(timeZone)
      .format('YYYY-MM-DD HH:mm:ss');

    const form_payment = await req.context.models.form_payment.create(
      {
        fopa_user_id: req.params.id,
        fopa_ongkir: fopa_ongkir,
        fopa_payment: fopa_payment,
        fopa_start_date: startDate,
        fopa_end_date: endDate,
        fopa_rek: '123456789',
        fopa_status: 'unpayment',
      },
      { transaction },
    );

    await req.context.models.carts.update(
      {
        cart_status: 'payment',
      },
      {
        returning: true,
        where: { cart_user_id: req.params.id },
      },
      { transaction },
    );
    // await cart.save({ transaction });

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
        [Op.or]: [{ fopa_user_id: req.params.id }, { fopa_status: 'payment' }],
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

    const address = await req.context.models.address.findOne({
      where: { add_user_id: req.params.id, add_mark_default: 'default' },
    });

    const ongkir = form_payment.fopa_ongkir;
    const payment = form_payment.fopa_payment;
    const no_rek = form_payment.fopa_rek;
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
    const startDate = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
    const endDate = moment(form_payment.fopa_end_date).format(
      'YYYY-MM-DD HH:mm:ss',
    );

    if (startDate >= endDate) {
      return res.status(200).json({
        message: 'No Data',
      });
    } else if (form_payment.fopa_status == 'payment') {
      return res.status(200).json({
        message: 'No Data',
      });
    } else {
      const result = { data_address, cart, ongkir, payment, no_rek };
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
      where: { cart_user_id: req.user.user_id },
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
    } else {
      const results = {
        data: 'Not Found',
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
    const form_payment = await req.context.models.form_payment.findAll({
      where: { fopa_user_id: req.user.user_id, fopa_status: 'unpayment' },
    });

    const result = [];
    for (let a = 0; a < form_payment.length; a++) {
      const cart = await req.context.models.carts.findAll({
        where: {
          cart_user_id: form_payment[a].fopa_user_id,
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

      const carts = [];
      for (let b = 0; b < cart.length; b++) {
        const data = {
          qty: cart[b].cart_qty,
          prod_name: cart[b].cart_prod.prod_name,
          prod_image: cart[b].cart_prod.prod_image,
          prod_price: cart[b].cart_prod.prod_price,
          prod_desc: cart[b].cart_prod.prod_desc,
          prod_stock: cart[b].cart_prod.prod_stock,
        };
        carts.push(data);
      }

      const address = await req.context.models.address.findOne({
        where: {
          add_user_id: form_payment[a].fopa_user_id,
          add_mark_default: 'default',
        },
      });
      const village = geografis.getVillage(address.add_village);

      const data = {
        id: form_payment[a].fopa_id,
        ongkir: form_payment[a].fopa_ongkir,
        payment: form_payment[a].fopa_payment,
        no_rek: form_payment[a].fopa_rek,
        status: form_payment[a].fopa_status,
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
        carts: carts,
      };

      result.push(data);
    }
    return res.status(200).json({
      message: 'List unpayment',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const listPayment = async (req, res) => {
  try {
    const form_payment = await req.context.models.form_payment.findAll({
      where: { fopa_user_id: req.user.user_id, fopa_status: 'payment' },
    });

    const result = [];
    for (let a = 0; a < form_payment.length; a++) {
      const cart = await req.context.models.carts.findAll({
        where: {
          cart_user_id: form_payment[a].fopa_user_id,
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

      const carts = [];
      for (let b = 0; b < cart.length; b++) {
        const data = {
          qty: cart[b].cart_qty,
          prod_name: cart[b].cart_prod.prod_name,
          prod_image: cart[b].cart_prod.prod_image,
          prod_price: cart[b].cart_prod.prod_price,
          prod_desc: cart[b].cart_prod.prod_desc,
          prod_stock: cart[b].cart_prod.prod_stock,
        };
        carts.push(data);
      }

      const address = await req.context.models.address.findOne({
        where: {
          add_user_id: form_payment[a].fopa_user_id,
          add_mark_default: 'default',
        },
      });
      const village = geografis.getVillage(address.add_village);

      const data = {
        id: form_payment[a].fopa_id,
        ongkir: form_payment[a].fopa_ongkir,
        payment: form_payment[a].fopa_payment,
        no_rek: form_payment[a].fopa_rek,
        status: form_payment[a].fopa_status,
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
        carts: carts,
      };

      result.push(data);
    }
    return res.status(200).json({
      message: 'List payment',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const uploadPayment = async (req, res) => {
  const { files, fields } = req.fileAttrb;
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
    );

    return res.status(200).json({
      message: 'Upload Bukti Pembayaran',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({
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
};
