const createRating = async (req, res) => {
    try {
        const { files, fields } = req.fileAttrb;
        const result = await req.context.models.rating.create({
            rat_count: fields[0].value,
            rat_desc: fields[1].value,
            rat_image: files[0].file.originalFilename,
            rat_user_id: fields[2].value,
            rat_prod_id: fields[3].value
        })

        return res.status(200).json({
            message: "Create Rating Successfully",
            data: result
        })
    } catch (error) {
        return res.status(404).json({
            message: error.message
        })
    }
}
