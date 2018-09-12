const rp = require('request-promise');

let parity_url = "http://10.35.11.56:8545";
let tranx = "0xe706d06bc4c76a59aa20a765da3fb0b7a2ae83774f90105e39773e347a4447ec";

let CancelTransaction = async function(parity_url, tranx) {   
    var options = {
        uri: parity_url,
        body: {
            "method":"parity_removeTransaction",
            "params":[tranx],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    console.log(JSON.stringify(options));
    
    try {
        let cancel_tranx = await rp.post(options);
        console.log("cancel_tranx >>> " + JSON.stringify(cancel_tranx));
        if (cancel_tranx&& cancel_tranx.result && cancel_tranx.result.hash) {
            return cancel_tranx.result.hash;
        } else {
             throw new Error(`Does not exists ${tranx}  transaction.`);
        }
    } catch (error) {
        throw error;
    }
}

let GetAllPendingTrans = async function(parity_url) {
    var options = {
        uri: parity_url,
        body: {
            "method":"parity_pendingTransactions",
            "params":[],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        let pending_transations = await rp.post(options);

        if (pending_transations&& pending_transations.result) {
            return pending_transations.result;
        } else {
             throw new Error(`Parity url ${parity_url} does not exist pending transactions.`);
        }
    } catch (error) {
        throw error;
    }
}

// GetAllPendingTrans(parity_url).then(function(data) {
//     console.log(JSON.stringify(data));
// })
// CancelTransaction(parity_url, tranx).then(function(result) {
//     console.log(JSON.stringify(result));
// }) ;

let Main = async function(parity_url) {
    let all_pending_trans = await GetAllPendingTrans(parity_url)
    let first_pending_one = all_pending_trans[0];
    console.log(first_pending_one.hash);
    return CancelTransaction(parity_url, first_pending_one.hash);
}

Main(parity_url).then(function(data) {
    console.log(JSON.stringify(data));
    
})
