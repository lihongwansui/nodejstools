// const fetch = require('fetch').fetchUrl;
const rp = require('request-promise');

let url = "http://10.35.0.57:51235";
let one_trans_url = "https://data.ripple.com/v2/accounts/rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn/transactions?type=Payment&result=tesSUCCESS&limit=1";


let all_trans_url = "https://data.ripple.com/v2/accounts/rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn/transactions?type=Payment&result=tesSUCCESS&limit=20";

let all_trans_url_01 = "https://data.ripple.com/v2/accounts/rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn/transactions?type=Payment&result=tesSUCCESS&limit=1&start=2014-06-02T22:47:55Z";

let test_get_all_transaction = "https://data.ripple.com/v2/transactions/?start=2018-07-25T05:05:01Z&end=2018-07-25T05:05:59Z";


let test_url = "https://s.altnet.rippletest.net:51234/v2/accounts/rptHRGQHzH2bPBeW9rJ12YknynzTDrKrNG/transactions?type=Payment&result=tesSUCCESS&limit=20";

let test_url_a = "http://10.35.0.57:51235/v2/accounts/rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn/transactions?type=Payment&result=tesSUCCESS&limit=1&start=2014-05-29T17:05:40Z"

let test_url_01 = "https://data.ripple.com/v2/accounts/rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn";

// &marker=rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn|20141002203220|000009160442|00002

let demo_url = "https://data.ripple.com/v2/accounts/rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn/transactions/11?binary=true";

let transaction_hash = "5D8E42DFC942FF5C11B5710B17C5EF9EAFDA2BBCBC1FF0B88DFED00555F19A8C";

let transaction_url = ``;

let Start = async function() {
    try {
        let all_transactions = await RequestRipperData(test_url);
        console.log(all_transactions.transactions)
        // all_transactions.transactions.map((item) => {
        //     console.log(item.date)
        // });
        
        // let i = 1;
        // all_transactions.transactions.map(trans => {
        //     if (typeof trans.hash === 'string') {
        //         console.log(i ++);
                
        //         console.log(trans.hash)
        //     } else {
        //         console.log(">>> >>> >> >>");
        //         console.log(JSON.stringify(trans));
        //     }
        // })
        
        // console.log(`${all_transactions}`);

        // console.log(`${JSON.parse(all_transactions)}`);

        // let one_transaction = await rp.get(one_trans_url);
        // console.log(JSON.parse(one_transaction).transactions);

    } catch (error) {
        console.log(`error stack is ${error.stack}`);
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

Start();

