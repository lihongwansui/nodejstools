const path = require('path');
path.sep = `\\`
let dir_path = `D:\mywok\blockchain\trunk\dax\lib\node\nodetools\reportforms\dailyreport\DailyReport-2018-05-07-1530154700053.xlsx`;
// console.log(">>>" + dir_path)
// let arr = path.basename(dir_path, ".xlsx")

// console.log(arr)


// 输出：test.js
console.log( path.basename('/tmp/demo/js/test.js') );

// 输出：test
console.log( path.basename('\\tmp\\demo\\js\\test.js') );

// 输出：test
console.log( path.basename('/tmp/demo/js/test') );