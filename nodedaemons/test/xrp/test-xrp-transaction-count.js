// &type=Payment
let test_get_all_transaction = "https://data.ripple.com/v2/transactions/?start=2018-07-25T20:05:50Z&end=2018-07-25T20:05:59Z&limit=100";
let test_get_all_transaction_01 = "https://data.ripple.com/v2/transactions/?start=2018-07-25T20:05:50Z&end=2018-07-25T20:05:59Z&limit=100&marker={0}";

const rp = require('request-promise');
const format = require('string-format');
format.extend(String.prototype, {})

let Init = async function() {
    try {
        let ret = await RequestRipperData(test_get_all_transaction);
        console.log(ret.marker);
        console.log(ret.transactions.length);

        let marker = ret.marker;
        while(marker) {
            let url = test_get_all_transaction_01.format(marker);
            let result = await RequestRipperData(url);
            marker = result.marker;
            console.log(result.marker);
            console.log(result.transactions.length);
        }
        
    } catch (error) {
        console.log(error.stack);
    }
}

let RequestRipperData = async function(url) {
    try {
        let options = {
            uri: url,
            json: true // Automatically parses the JSON string in the response
        };
        return await rp.get(options)
    } catch (error) {
        throw error;
    }
}

Init();