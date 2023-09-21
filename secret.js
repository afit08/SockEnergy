const geografis = require('geografis'); 
const provinces = geografis.getProvinces();
// console.log(provinces)
// Province
const province = geografis.getProvince('31');
console.log(province)
// Kota
const city = geografis.getCity('31.75');
// console.log(city.city)
// Kecamatan
const district = geografis.getDistrict('31.75.04');
// console.log(district)
// Kelurahan
const village = geografis.getVillage('31.75.04.1002');
// console.log(village)
// Maps
const maps = geografis.getNearest(-6.288241482465205,106.86479661955742);
// console.log(maps)


const data1 = "JAKARTA TIMUR";
const data2 = "Jakarta Timur";
if (data1.toLowerCase() === data2.toLowerCase()) {
    console.log("true");
}


const wilayah = require('wilayah-indonesia');



const kecamatan = wilayah('jakarta', 'kota');



kecamatan.then(val => {

console.log('Data kecamatan: ', val);

});


const kodepos = require('kodepos');
 
// Get city from zip
console.log(kodepos.get(13540));
//=> Cikini
 
// Search city + zip
kodepos.search('cempaka');
//=> { '10510': 'Cempaka Putih Timur', '10520': 'Cempaka Putih Barat' }