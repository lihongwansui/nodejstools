const baseConvert = require('baseconvert');
let input = "0xa9059cbb00000000000000000000000094b254a343037356e6e9ace83a1c0c1fdf432a3200000000000000000000000000000000000000000000000000000002540be400";

let value = input.slice(74, 138);
console.log(value);

let ret = baseConvert.converter(value
).fromBase(16).toBase(10)
console.log(ret);

