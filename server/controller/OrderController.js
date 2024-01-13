const sequelize = require('../helpers/queryConn');
const geografis = require('geografis');
const moment = require('moment');

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
            (fopa_status = 'unpayment' AND fopa_payment = 'Cash on Delivery')
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

    return res.status(200).json({
      message: 'All Orders',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const detailOrder = async (req, res) => {
  try {
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

    return res.status(200).json({
      message: 'Detail Orders',
      data: data,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateStatusOrder = async (req, res) => {
  const { fopa_number_resi } = req.body;
  const transaction = await sequelize.transaction();
  try {
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
      message: 'Update Status Orders',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
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

    return res.status(200).json({
      message: 'All Done Orders',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const detailDoneOrder = async (req, res) => {
  try {
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

    return res.status(200).json({
      message: 'Detail Orders',
      data: data,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const Pickup = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
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

    return res.status(200).json({
      message: 'Updating Pickup Courier to Tracking',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
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
};
