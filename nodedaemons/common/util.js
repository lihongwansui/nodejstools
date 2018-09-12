let baseConvert = require('baseconvert');

var util = {
   /**
    * @method ConvertFrom16To10
    * @params number: string
    * @return number: base10 number
    */
    ConvertFrom16To10: function (number) {
        let target = baseConvert.converter(number).fromBase(16).toBase(10);
        return parseInt(target);
    },
    /**
     * @method ConvertFrom10To16
     * @params number: base10 number
     * @return sting: base16
     */
    ConvertFrom10To16: function (number) {
        return "0x" + baseConvert.converter(number).fromBase(10).toBase(16);
    },
    /**
     * @method ConvertArrayToString
     * @params arr: Array
     * @return sting: String
     */
    ConvertArrayToString: function(arr) {
        if (arr && arr.length === 1) {
            return "'"+ arr[0].toString()+"'";
        }
        let result = arr.reduce(function(pre, current) {
            if (pre === arr[0]) {
                return "'"+pre+"','"+current.toString()+"'";
            } else {
                return pre +",'"+current.toString()+"'";
            }
        })
        
        return result;
    }
}

module.exports = util;