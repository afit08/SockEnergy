const axios = require('axios');
const qs = require('qs');
let data = qs.stringify({
  origin: '115',
  destination: '154',
  weight: '1000',
  courier: 'jne',
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: `${process.env.API_COST}`,
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    key: `${process.env.KEY_ONGKIR}`,
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
