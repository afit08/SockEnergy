const sequelize = require('../helpers/queryConn');
const createRating = async (req, res) => {
  try {
    const { files, fields } = req.fileAttrb;
    const result = await req.context.models.rating.create({
      rat_count: fields[0].value,
      rat_desc: fields[1].value,
      rat_image: files[0].file.originalFilename,
      rat_user_id: req.user.user_id,
      rat_prod_id: fields[2].value,
      rat_fopa_id: fields[3].value,
    });

    return res.status(200).json({
      message: 'Create Rating Successfully',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const detailRating = async (req, res) => {
  try {
    const data_product = await sequelize.query(
      `
            SELECT
            a.cart_id,
            a.cart_qty,
            a.cart_fopa_id,
            b.prod_id,
            b.prod_name,
            b.prod_image,
            b.prod_price
            FROM carts a
            INNER JOIN products b ON b.prod_id = a.cart_prod_id
            WHERE cart_fopa_id = :id
            and prod_id = :ids
        `,
      {
        replacements: { id: req.params.id, ids: req.params.ids },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return res.status(200).json({
      message: 'Detail Rating',
      data: data_product,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const ListRating = async (req, res) => {
  try {
    const result = await sequelize.query(
      `
        select 
        a.rat_id,
        a.rat_desc,
        a.rat_image,
        b.user_id,
        b.user_personal_name,
        c.prod_id,
        c.prod_name
        from rating a
        inner join users b on b.user_id =  a.rat_user_id
        inner join products c on c.prod_id = a.rat_prod_id
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return res.status(200).json({
      message: 'Detail Rating For Users',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export default {
  createRating,
  detailRating,
  ListRating,
};
