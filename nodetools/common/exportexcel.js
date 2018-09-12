const xlsx = require('node-xlsx').default;
const dateFormat = require('dateformat');
const fs = require("fs") ;
const path = require('path');
const file_path = path.join(__dirname,  "../reportforms/dailyreport");
//const file_path = "./nodetools/reportforms/dailyreport";
const logger = require('../../nodedaemons/common/logger/logger');

let ExportSingleSheet = function(fileName, items, callback) {
    
    let buffer = xlsx.build([{name: fileName, data: items}]);
    fileName =  fileName+"-"+Date.now()+ ".xlsx";
    let excel_path = file_path +"\\"+ fileName;
    fs.writeFileSync(excel_path, buffer, 'binary');
    if (callback) {
        callback(excel_path);
    }
}

let ExportMultiSheets = function(fileName, sheetsData) {
    var xlsl_list = [];
    for(var i=0; i<sheetsData.length; i++) {
        var sheetName = "";
        if (sheetsData[i].sheetName.length > 30) {
            sheetName = sheetsData[i].sheetName.substr(30);
        } else {
            sheetName = sheetsData[i].sheetName;
        }
        xlsl_list.push({name: sheetName, data: sheetsData[i].items});
    }
    var buffer = xlsx.build(xlsl_list);

    fileName =  fileName+"-" + dateFormat(new Date(),'yyyy-mm-dd HH:MM') +"-"+Date.now()+ ".xlsx";
    console.log(">>>>" + fileName);
    
    fs.writeFileSync(file_path +"/"+ fileName, buffer, 'binary');
}

module.exports = {
    ExportSingleSheet: ExportSingleSheet,
    ExportMultiSheets: ExportMultiSheets
}
