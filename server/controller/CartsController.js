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
  try {
    const { fopa_ongkir, fopa_payment } = req.body;
    const timeZone = 'Asia/Jakarta';
    const startDate = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
    const endDate = moment()
      .add(1, 'days')
      .tz(timeZone)
      .format('YYYY-MM-DD HH:mm:ss');

    const form_payment = await req.context.models.form_payment.create({
      fopa_user_id: req.params.id,
      fopa_ongkir: fopa_ongkir,
      fopa_payment: fopa_payment,
      fopa_start_date: startDate,
      fopa_end_date: endDate,
      fopa_rek: '123456789',
    });

    return res.status(200).json({
      message: 'Creating Payment',
      data: form_payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const showPayment = async (req, res) => {
  try {
    const result = await req.context.models.form_payment.findAll({
      where: { fopa_user_id: req.params.id },
      include: [
        {
          model: req.context.models.users,
          as: 'fopa_user',
          attributes: [
            'user_id',
            'user_name',
            'user_handphone',
            'user_address',
          ],
          include: [
            {
              model: req.context.models.carts,
              as: 'carts',
              attributes: [
                'cart_id',
                'cart_qty',
                'cart_status',
                'cart_prod_id',
              ],
              include: [
                {
                  model: req.context.models.products,
                  as: 'cart_prod',
                  attributes: [
                    'prod_id',
                    'prod_name',
                    'prod_image',
                    'prod_price',
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const results = [];
    for (let index = 0; index < result.length; index++) {
      const timeZone = 'Asia/Jakarta';
      const startDate = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
      const endDate = moment()
        .add(1, 'days')
        .tz(timeZone)
        .format('YYYY-MM-DD HH:mm:ss');
      const end = moment(result[index].fopa_end_date)
        .tz(timeZone)
        .format('YYYY-MM-DD HH:mm:ss');
      const start = moment(result[index].fopa_end_date)
        .tz(timeZone)
        .format('YYYY-MM-DD HH:mm:ss');

      const unpayment = result[index].fopa_user.carts[0].cart_status;
      console.log(unpayment);
      if (end >= endDate) {
        const carts = result[index].fopa_user.carts;

        const cart = [];
        for (let a = 0; a < carts.length; a++) {
          if (carts[a].cart_status == 'unpayment') {
            const data = {
              cart_id: carts[a].cart_id,
              cart_qty: carts[a].cart_qty,
              cart_status: carts[a].cart_status,
              prod_id: carts[a].cart_prod.prod_id,
              prod_name: carts[a].cart_prod.prod_name,
              prod_image: carts[a].cart_prod.prod_image,
              prod_price: carts[a].cart_prod.prod_price,
              amount: carts[a].cart_qty * carts[a].cart_prod.prod_price,
            };
            cart.push(data);
          }
        }
        console.log(cart);

        const sum = cart.reduce((acc, current) => acc + current.amount, 0);

        const data = {
          user_id: result[index].fopa_user.user_id,
          user_name: result[index].fopa_user.user_name,
          user_handphone: result[index].fopa_user.user_handphone,
          user_address: result[index].fopa_user.user_address,
          fopa_ongkir: result[index].fopa_ongkir,
          fopa_payment: result[index].fopa_payment,
          fopa_image_transaction: result[index].fopa_image_transaction,
          cart: [...cart],
          subtotal: sum,
        };

        results.push(data);
      }
    }

    return res.status(200).json({
      message: 'Show Form Payment',
      data: results,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const checkout = async (req, res) => {
  try {
    const address = await req.context.models.address.findOne({
      where: { add_mark_default: 'default' },
    });

    const village = geografis.getVillage(address.add_village);

    const data_address = [
      {
        personal_name: address.add_personal_name,
        phone_number: address.add_phone_number,
        address: address.add_address,
        area:
          village.village +
          village.district +
          village.city +
          village.province +
          village.postal,
      },
    ];

    //   Data Payment
    const data_payment = await req.context.models.payment_method.findAll({});

    const cart = await req.context.models.carts.findAll({
      where: { cart_status: 'unpayment', cart_user_id: req.user.user_id },
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

    const results = {
      data_address,
      data_ongkir,
      data_payment,
      data_cart,
      subtotal,
    };
    return res.status(200).json({
      message: 'Show Form Checkout',
      data: results,
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
};
