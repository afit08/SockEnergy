const geografis = require('geografis'); 
const provinces = geografis.getProvinces();
// console.log(provinces)
// Province
const province = geografis.getProvince('31');
// console.log(province)
// Kota
const city = geografis.getCity('31.75');
// console.log(city)
// Kecamatan
const district = geografis.getDistrict('31.75.04');
console.log(district)
// Kelurahan
const village = geografis.getVillage('31.75.04.1002');
console.log(village)
// Maps
const maps = geografis.getNearest(-6.288241482465205,106.86479661955742);
// console.log(maps)