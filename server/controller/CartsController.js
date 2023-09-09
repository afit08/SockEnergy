import sequelize from 'sequelize';
const { Op } = require('sequelize');
const moment = require('moment-timezone');
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');

const allCart = async (req, res) => {
    try {
        const result = await req.context.models.carts.findAll({
            include: [
                {
                    model: req.context.models.products,
                    as: "cart_prod",
                    attributes: [
                        "prod_name",
                        "prod_image",
                        "prod_price"
                    ]
                }
            ]
        });

        const coba = [];
        for (let index = 0; index < result.length; index++) {
            const count = result[index].cart_prod.prod_price * result[index].cart_qty;
            const data = {
                total: count
            }
            coba.push(data);
        }
        const sum = coba.reduce((acc, current) => acc + current.total, 0);

        const results = { result, sum }

        return res.status(200).json(({
            message: "Show All Carts",
            data: results
        }))
    } catch (error) {
        return res.status(404).json({
            message: error.message
        })
    }
}

const addCart = async (req, res) => {
    const { cart_qty,cart_prod_id } = req.body;
    try {
        const result = await req.context.models.carts.create({
            cart_qty: cart_qty,
            cart_prod_id: cart_prod_id,
            cart_user_id: req.user.user_id,
            cart_status: "unpayment"
        });

        return res.status(200).json({
            message: "Add Cart",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

const postToPayment = async (req, res) => {
    try {
        const { fopa_ongkir, fopa_payment } = req.body;
        const timeZone = 'Asia/Jakarta';
        const startDate = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss')
        const endDate = moment().add(1, 'days').tz(timeZone).format('YYYY-MM-DD HH:mm:ss')

        const form_payment = await req.context.models.form_payment.create({
            fopa_user_id: req.params.id,
            fopa_ongkir: fopa_ongkir,
            fopa_payment: fopa_payment,
            fopa_start_date: startDate,
            fopa_end_date: endDate,
            fopa_rek: "123456789"
        });

        return res.status(200).json({
            message: "Creating Payment",
            data: form_payment
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

const showPayment = async (req, res) => {
    try {
        const result = await req.context.models.form_payment.findAll({
            where: { fopa_user_id: req.params.id },
            include: [
                {
                    model: req.context.models.users,
                    as: "fopa_user",
                    attributes: [
                        "user_id",
                        "user_name",
                        "user_handphone",
                        "user_address"
                    ],
                    include: [
                        {
                            model: req.context.models.carts,
                            as: "carts",
                            attributes: [
                                "cart_id",
                                "cart_qty",
                                "cart_status",
                                "cart_prod_id"
                            ],
                            include: [
                                {
                                    model: req.context.models.products,
                                    as: "cart_prod",
                                    attributes: [
                                        "prod_id",
                                        "prod_name",
                                        "prod_image",
                                        "prod_price"
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        const results = [];
        for (let index = 0; index < result.length; index++) {
            const timeZone = 'Asia/Jakarta';
            const startDate = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss')
            const endDate = moment().add(1, 'days').tz(timeZone).format('YYYY-MM-DD HH:mm:ss')
            const end = moment(result[index].fopa_end_date).tz(timeZone).format('YYYY-MM-DD HH:mm:ss')
            const start = moment(result[index].fopa_end_date).tz(timeZone).format('YYYY-MM-DD HH:mm:ss')

            const unpayment = result[index].fopa_user.carts[0].cart_status;
            console.log(unpayment);
            if (end >= endDate) {
                const carts = result[index].fopa_user.carts

                const cart = [];
                for (let a = 0; a < carts.length; a++) {
                    if (carts[a].cart_status == "unpayment") {
                        const data = {
                            cart_id: carts[a].cart_id,
                            cart_qty: carts[a].cart_qty,
                            cart_status: carts[a].cart_status,
                            prod_id: carts[a].cart_prod.prod_id,
                            prod_name: carts[a].cart_prod.prod_name,
                            prod_image: carts[a].cart_prod.prod_image,
                            prod_price: carts[a].cart_prod.prod_price,
                            amount: carts[a].cart_qty * carts[a].cart_prod.prod_price
                        }   
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
                    subtotal: sum
                }
    
                results.push(data);
            }
        }

        return res.status(200).json({
            message: "Show Form Payment",
            data: results
        })
    } catch (error) {
        return res.status(404).json({
            message: error.message
        })
    }
}

const checkout = async (req, res) => {
    try {
        const users = await req.context.models.users.findOne({
            where: { user_id: req.params.id},
            attributes: [
                "user_id",
                "user_personal_name",
                "user_handphone",
                "user_address",
                "user_province",
                "user_city",
            ]
        });

        // API Province
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `${process.env.API_PROVINCE}?id=${users.user_province}`,
            headers: { 
              'key': `${process.env.KEY_ONGKIR}`
            }
          };
          
          const response = await axios(config).then(function (response) {
            return response.data.rajaongkir;
          });
          const province = response.results;

          let configs = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `${process.env.API_CITY}?id=${users.user_city}`,
            headers: { 
                'key': `${process.env.KEY_ONGKIR}`
            }
          };
          
          const responses = await axios(configs).then(function (responses) {
            return responses.data.rajaongkir;
          });
          const city = responses.results;

          const address_users = { users, province, city }

        const carts = await req.context.models.carts.findAll({
            // where: { cart_user_id: req.params.id },
            include: [
                {
                    model: req.context.models.products,
                    as: "cart_prod",
                    attributes: [
                        "prod_name",
                        "prod_image",
                        "prod_price"
                    ]
                }
            ]
        });

        const result = [];
        if (carts[0].cart_status == "unpayment") {
            for (let index = 0; index < carts.length; index++) {
                const data = {
                    cart_status: carts[index].cart_status,
                    prod_image: carts[index].cart_prod.prod_image,
                    prod_name: carts[index].cart_prod.prod_name,
                    prod_price: carts[index].cart_prod.prod_price,
                    qty: carts[index].cart_qty,
                    amount: carts[index].cart_qty * carts[index].cart_prod.prod_price,
                }
                result.push(data);
            }    
        }

        const payment = await req.context.models.payment_method.findAll({

        });

        const admin = await req.context.models.users.findAll({
            include: [
                {
                    model: req.context.models.roles,
                    as: "user_role",
                    where: { role_name: "admin" },
                    attributes: [
                        "role_id",
                        "role_name"
                    ]
                }
            ]
        })

        let data = qs.stringify({
            'origin': `${admin[0].user_city}`,
            'destination': `${users.user_city}`,
            'weight': '1700',
            'courier': 'jne' 
          });
          
          let cost = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${process.env.API_COST}`,
            headers: { 
              'content-type': 'application/x-www-form-urlencoded', 
              'key': `${process.env.KEY_ONGKIR}`
            },
            data : data
          };
          
          const ongkir = await axios(cost).then(function (ongkir) {
            return ongkir.data.rajaongkir;
          });
          const ongkirs = ongkir.results

        const results = { address_users, result, payment, ongkirs }

        return res.status(200).json({
            message: "Show Form Checkout",
            data: results
        })
    } catch (error) {
        return res.status(404).json({
            message: error.message
        })
    }
}

export default {
    allCart,
    addCart,
    postToPayment,
    showPayment,
    checkout
}