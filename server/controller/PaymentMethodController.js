const allPaymentMethod = async (req, res) => {
    try {
        const result = await req.context.models.payment_method.findAll({

        });

        return res.status(200).json({
            message: "Show all payment method",
            data: result
        });
    } catch (error) {
        return res.status(404).json({
            message: error.message
        });
    }
}

const createPaymentMethod = async (req, res) => {
    const { payment_name } = req.body;
    try {
        const result = await req.context.models.payment_method.create({
            payment_name: payment_name
        });
        
        return res.status(200).json({
            message: "Create payment method",
            data: result
        });
    } catch (error) {
        return res.status(404).json({
            message: error.message
        })
    }
}

export default {
    allPaymentMethod,
    createPaymentMethod
}