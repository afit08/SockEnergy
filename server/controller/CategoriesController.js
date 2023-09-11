const createCategories = async (req, res) => {
  const { files, fields } = req.fileAttrb;

  try {
    const result = await req.context.models.categories.create({
      cate_name: fields[0].value,
      cate_image: files[0].file.originalFilename,
    });

    return res.status(200).json({
      message: "Create Categories",
      data: result,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const allCategories = async (req, res) => {
  try {
    const result = await req.context.models.categories.findAll({
      attributes: ["cate_name", "cate_image", "cate_created_at"],
    });
    console.log(result);
    return res.status(200).json({
      message: "Show All Categories",
      data: result,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const detailCategories = async (req, res) => {
  try {
    const result = await req.context.models.categories.findAll({
      where: { cate_id: req.params.id },
      attributes: [
        "cate_name",
        "cate_image"
      ]
    });

    return res.status(200).json({
      message: "Detail Categories",
      data: result
    })
  } catch (error) {
    return res.status(404).json({
      message: error.message
    })
  }
}

const editCategories = async (req, res) => {
  try {
    const { files, fields } = req.fileAttrb;

    const result = await req.context.models.categories.update(
        {
            cate_name: fields[0].value,
            cate_image: files[0].file.originalFilename,
        },
        {
            returning: true,
            where: { cate_id: req.params.id },
        },
    )

    return res.status(200).json({
        message: "Edit Categories",
        data: result[1][0]
    });
  } catch (error) {
    return res.status(404).json({ message: error.message })
  }
};

const deleteCategories = async (req, res) => {
    try {
        const result = await req.context.models.categories.destroy({
            where : { cate_id: req.params.id }
        });

        return res.status(200).json({
            message: "Delete Categories",
            data: result
        })
    } catch (error) {
        return res.status(404).json({
            message: error.message
        })
    }
}
export default {
  createCategories,
  allCategories,
  editCategories,
  deleteCategories,
  detailCategories
};
