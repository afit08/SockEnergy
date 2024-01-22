const createAbout = async (req, res) => {
  try {
    const { files, fields } = req.fileAttrb;
    const result = await req.context.models.about.create({
      abt_title: fields[0].value,
      abt_desc: fields[1].value,
      abt_image: files[0].file.originalFilename,
      abt_lat: fields[2].value,
      abt_long: fields[3].value,
    });

    return res.status(200).json({
      message: 'Create About Successfully',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const allAbout = async (req, res) => {
  try {
    const result = await req.context.models.about.findAll({});

    await redisClient.setex('allAbout', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('allAbout');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'All About',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'All About',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const oneAbout = async (req, res) => {
  try {
    const result = await req.context.models.about.findOne({
      where: { abt_id: req.params.id },
    });

    await redisClient.setex('oneAbout', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('oneAbout');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Find One About',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'Find One About',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateAbout = async (req, res) => {
  try {
    const { files, fields } = req.fileAttrb;
    const result = await req.context.models.about.update(
      {
        abt_title: fields[0].value,
        abt_desc: fields[1].value,
        abt_image: files[0].file.originalFilename,
        abt_lat: fields[2].value,
        abt_long: fields[3].value,
      },
      { returning: true, where: { abt_id: req.params.id } },
    );

    return res.status(200).json({
      message: 'Update About',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export default {
  createAbout,
  allAbout,
  oneAbout,
  updateAbout,
};
