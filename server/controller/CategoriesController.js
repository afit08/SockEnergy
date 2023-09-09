const createCategories = async (req, res) => {
    const { cate_name } = req.body;

    try {
        const result = await req.context.models.categories.create({
            cate_name: cate_name
        });

        return res.status(200).json({
            message: "Create Categories",
            data: result
        });
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
}

const allCategories = async (req, res) => {
    try {
        const result = await req.context.models.categories.findAll({
            
        });

        return res.status(200).json({
            message: "Show All Categories",
            data: result
        });
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
}

export default{
    createCategories,
    allCategories
}