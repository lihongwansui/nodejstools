const {ExportSingleSheet, ExportMultiSheets} = require('../common/exportexcel');
const path = require('path');
let target_path = path.join(__dirname, "../reportforms/files");

let TestSingleSheet = function() {
    let file_name = "DailyReport";
    let data = [["币种", "交易量", "交易额"], ["ETH", 123, 123], ["BTC", 234, 234], ["ETC", 345, 345]]
    ExportSingleSheet(file_name, data);
} 

// let TestMultiSheets = function() {

// }

let Init = function() {
    TestSingleSheet();
    //TestMultiSheets();
};

Init();