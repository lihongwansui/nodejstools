const OS = require('os');

let result = OS.cpus();        

console.log(JSON.stringify(result));
