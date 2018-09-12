const log4js = require('log4js');
const path = require('path');
log4js.configure(path.join(__dirname, "./log4js-config.json"));
const logInfo = log4js.getLogger("logger");
const eosLogInfo = log4js.getLogger("eoslogger");
const ripperLogInfo = log4js.getLogger("ripperlogger");
const usdtLogInfo = log4js.getLogger("usdtlogger");
const peationdepositInfo = log4js.getLogger("peationdepositlogger");
const erosError = log4js.getLogger("eoserror");
let logError = log4js.getLogger("error");
log4js.info = logInfo.info.bind(logInfo);
log4js.eosinfo = logInfo.info.bind(eosLogInfo);
log4js.eoserror = logError.error.bind(erosError);
log4js.error = logError.error.bind(logError);
log4js.ripperinfo = logInfo.info.bind(ripperLogInfo);
log4js.usdtinfo = logInfo.info.bind(usdtLogInfo);
log4js.depositinfo = logInfo.info.bind(peationdepositInfo);
/**
  * logger tag
  * @param {Object} method
  */
log4js.Tag = function(method){
    "use strict";
    var timestamp=new Date().getTime();
    if(method){
        return method+`[${timestamp}]>>> `
    }else{
        return `[${timestamp}]>>> `
    }

}
log4js.DebugTag = function(method){
    "use strict";
    if(method){
        return `${method}>>> `
    }else{
        return `>>> `
    }
}
log4js.ErrorTag = function(method){
    "use strict";
    var timestamp=new Date().getTime();
    if(method){
        return method+`>>> ERROR >>>[${timestamp}]>>> `
    }else{
        return `>>> ERROR >>>[${timestamp}]>>> `
    }
}
module.exports = log4js;