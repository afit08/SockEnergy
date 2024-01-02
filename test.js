const axios = require('axios');
const qs = require('qs');
let data = qs.stringify({
  waybill: '10008197284779',
  courier: 'anteraja',
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://pro.rajaongkir.com/api/waybill',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    key: '65358a6c1fa088be3b6fa599a7b1d0ea',
  },
  data: data,
};

axios
  .request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
