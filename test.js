const shortid = require('shortid');

console.log(shortid.generate());

// console.log(shortid.characters('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$@'));

const moment = require('moment-timezone');
const timeZone = 'Asia/Jakarta';
const date = moment().tz(timeZone).format('DDMMYY');

console.log('SE' + date);
