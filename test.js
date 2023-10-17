// const dateToCron = (date) => {
//   const minutes = date.getMinutes();
//   const hours = date.getHours();
//   const days = date.getDate();
//   const months = date.getMonth() + 1;
//   const dayOfWeek = date.getDay();

//   return `${minutes} ${hours} ${days} ${months} ${dayOfWeek}`;
// };

// const date = new Date();

// const cron = dateToCron(date);
// console.log(cron); //30 5 9 5 2

const axios = require('axios');

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'http://100.78.16.82:3000/sock/api/carts/listUnpayment',
  headers: {
    Authorization:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTNiNmNmMDktODZhNC00N2Y1LTlmYTUtNTllMjNmZmExMGMwIiwidXNlcm5hbWUiOiJjdXN0b21lciIsInJvbGVUeXBlIjoiY3VzdG9tZXIiLCJ1c2VyX3Bob3RvIjoidXNlcnMuanBnIiwiaWF0IjoxNjk3NTI0MzA4LCJleHAiOjE2OTc2MTA3MDh9.JUBbXMQwb2SHJPve0hIt-w9plDxD1lfrY_iIvv34XIg',
    Cookie:
      'jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTNiNmNmMDktODZhNC00N2Y1LTlmYTUtNTllMjNmZmExMGMwIiwidXNlcm5hbWUiOiJjdXN0b21lciIsInJvbGVUeXBlIjoiY3VzdG9tZXIiLCJ1c2VyX3Bob3RvIjoidXNlcnMuanBnIiwiaWF0IjoxNjk3NTI0MjI5LCJleHAiOjE2OTgxMjkwMjl9.HL8EEfrXb5AHk87kxp6IcJ-TTWWnZdwVg9aob0-rJeY',
  },
};

// axios
//   .request(config)
//   .then((response) => {
//     console.log(JSON.stringify(response.data));
//   })
//   .catch((error) => {
//     console.log(error);
//   });

const response = axios(config);
const result = response.data;
console.log(response);
const test = async (req, res) => {};

async () => {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'http://100.78.16.82:3000/sock/api/carts/listUnpayment',
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTNiNmNmMDktODZhNC00N2Y1LTlmYTUtNTllMjNmZmExMGMwIiwidXNlcm5hbWUiOiJjdXN0b21lciIsInJvbGVUeXBlIjoiY3VzdG9tZXIiLCJ1c2VyX3Bob3RvIjoidXNlcnMuanBnIiwiaWF0IjoxNjk3NTI0MzA4LCJleHAiOjE2OTc2MTA3MDh9.JUBbXMQwb2SHJPve0hIt-w9plDxD1lfrY_iIvv34XIg',
        Cookie:
          'jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTNiNmNmMDktODZhNC00N2Y1LTlmYTUtNTllMjNmZmExMGMwIiwidXNlcm5hbWUiOiJjdXN0b21lciIsInJvbGVUeXBlIjoiY3VzdG9tZXIiLCJ1c2VyX3Bob3RvIjoidXNlcnMuanBnIiwiaWF0IjoxNjk3NTI0MjI5LCJleHAiOjE2OTgxMjkwMjl9.HL8EEfrXb5AHk87kxp6IcJ-TTWWnZdwVg9aob0-rJeY',
      },
    };

    const response = await axios(config);
    console.log(response.data.data);
  } catch (error) {}
};
