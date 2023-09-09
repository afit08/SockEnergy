const createRoles = async (req, res) => {
    const {
        role_name
    } = req.body;
    try {
        const result = await req.context.models.roles.create({
            role_name: role_name
        });

        return res.status(200).json({
            message: "create data roles",
            data: result
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const allRoles = async (req, res) => {
    try {
        const result = await req.context.models.roles.findAll({
        });

        return res.status(200).json({
            message: "show all data roles",
            data: result
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export default{
    createRoles,
    allRoles
}