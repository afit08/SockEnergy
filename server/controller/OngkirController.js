const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

const ongkirDestination = async (req, res) => {
    try {

        // let provinsi = {
        //   method: 'get',
        //   maxBodyLength: Infinity,
        //   url: 'https://api.rajaongkir.com/starter/province?id=',
        //   headers: { 
        //     'key': '65358a6c1fa088be3b6fa599a7b1d0ea'
        //   }
        // };
        
        // const response_provinsi = await axios(provinsi);
        // const province = response_provinsi.data.rajaongkir.results;
        const users = await req.context.models.users.findOne({
            where: { user_id: req.user.user_id },
            attributes: [
                "user_city",
                "user_province"
            ]
        });

        let kota = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.rajaongkir.com/starter/city?id=${users.user_city}&province=${users.user_province}`,
            headers: { 
              'key': '65358a6c1fa088be3b6fa599a7b1d0ea'
            }
          };
          
          const response_kota = await axios(kota);
          const city = response_kota.data.rajaongkir.results;

          let data = qs.stringify({
            // ASAL TOKO
            'origin': `${users.user_city}`,
            // TUJUAN PENGIRIMAN
            'destination': `${city.city_id}`,
            'weight': '1700',
            'courier': 'jne' 
          });
          
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.rajaongkir.com/starter/cost',
            headers: { 
              'content-type': 'application/x-www-form-urlencoded', 
              'key': '65358a6c1fa088be3b6fa599a7b1d0ea'
            },
            data : data
          };

          const response = await axios(config);
          const result = response.data.rajaongkir.results

    return res.status(200).json({
        message: "Data Ongkir",
        data: result[0].costs
    })
        
    } catch (error) {
    
    return res.status(404).json({
        message: error.message
    })

    }
}

export default {
    ongkirDestination
}