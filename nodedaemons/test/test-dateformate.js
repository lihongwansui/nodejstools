const dateformat = require('dateformat');

let now = new Date();
let result = dateformat(now, "yyyy-mm-dd HH:MM:ss");

console.log(result);
