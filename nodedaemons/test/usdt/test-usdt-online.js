const account_address  = "1EXoDusjGwvnjZUyKkxZ4UHEf77z6A5S4P";
const rp = require('request-promise');
const format = require('string-format');
format.extend(String.prototype, {});
const fs = require('fs');
const path = require('path');
let backup_path = path.join(__dirname, './test-usdt-backup.txt');
const base_url = "https://api.omniexplorer.info";
// const base_url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.0.57:18332";
// const base_url = "http://10.35.0.57:18332";

let Start = async function(base_url, account_address) {
    try {
        let ret = await GetAllTransactions(base_url, account_address, 0);
        console.log(ret.transactions);
        
    } catch (error) {
        console.log(error.stack);
    }
}

let GetAllTransactions = async function(base_url, account_address, page) {
    let base_body = "addr={0}&page={1}";
    let body =  base_body.format(account_address, page);
    console.log(JSON.stringify(body));
    
    try {
        let url = base_url + "/v1/transaction/address";
        let options = {
            uri: url,
            body: body,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            json: true // Automatically stringifies the body to JSON
        };
        return await rp.post(options);
    } catch (error) {
        throw error;
    }
}

let GetTransaction = async function(base_url, transaction_hash) {
    try {
        let url = base_url + "/v1/transaction/tx/{0}"
        let target_url = url.format(transaction_hash);
        console.log(`>>>>> ${target_url}`);
        
        let options = {
            uri: target_url,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = await rp.get(options);
        console.log(JSON.stringify(ret));
    } catch (error) {
        throw error;
    }
}


// Start(base_url, account_address);

let transaction_hash = "0469bbde9252c6340fb41dbcb5ff25549e081d9602867311619ef43614fef23e";
// let hash2 = "e0e3749f4855c341b5139cdcbb4c6b492fcc09c49021b8b15462872b4ba69d1b";
GetTransaction(base_url, transaction_hash);