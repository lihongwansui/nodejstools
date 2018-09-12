const rp = require('request-promise');

let test_net_url = "https://s.altnet.rippletest.net:51234";

let Start = async function() {
    try {
        let after_sign = await SignXRP();
        // console.log(JSON.stringify(after_sign));
        if (after_sign && after_sign.result && after_sign.result.status === "success") {
            let ret = await SendTransaction(after_sign.result.tx_blob);
            console.log(">>> >>> " + JSON.stringify(ret));
        }
    } catch (error) {
        console.log(error.stack);
    }
}

let SignXRP = async function() {
    try {
        let options = {
            uri: test_net_url,
            body: {
                "method":"sign",
                "params": [
                    {
                        "offline": false,
                        "secret": "ssMirMLg3T4WtxJpGeg6oXcSuWfRi",
                        "fee_mult_max": 1000,
                        "tx_json": {
                           "Account": "rwx5qckmiUPoqvRnGWy7uyJM3RFW2VXJjE",
                            "Sequence": 1,
                            // "LastLedgerSequence": 10268600,
                            "Fee": 10000,
                            "Amount": 100,
                            "Destination": "rptHRGQHzH2bPBeW9rJ12YknynzTDrKrNG",
                            "TransactionType": "Payment",
                            "SourceTag": "123456"
                        }
                    }
                ],
                "id":1,
                "jsonrpc":"2.0"
            },
            // headers: {
            //     'Content-Type': 'application/json',
            // },
            json: true // Automatically stringifies the body to JSON
        };

        return await rp.post(options);
    } catch (error) {
        throw error;
    }
}

let SendTransaction = async function(tx_blob) {
    try {
        let options = {
            uri: test_net_url,
            body: {
                "method": "submit",
                "params": [{
                    "tx_blob": tx_blob
                }],
                "id":1,
                "jsonrpc":"2.0"
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };

        return await rp.post(options);
    } catch (error) {
        throw error;
    }
}

let hash01 = "11CF4B8E5DBE29284B59E03242E785B9AEF1C39D6725DB73DA53037FCE6329EE";

let GetTransaction = async function(hash) {
    try {
        let options = {
            uri: test_net_url,
            body: {
                "method": "tx",
                "params": [
                    {
                        "transaction": hash,
                        "binary": false
                    }
                ],
                "id":1,
                "jsonrpc":"2.0"
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };

        let ret =  await rp.post(options);
        console.log(hash);
        console.log(JSON.stringify(ret.result.ledger_index));
        
    } catch (error) {
        throw error;
    }
}

let SignAndSubmit = async function() {
    try {
        let options = {
            uri: test_net_url,
            body: {
                "method": "submit",
                "params": [
                    {
                        "offline": false,
                        "secret": "ssMirMLg3T4WtxJpGeg6oXcSuWfRi",
                        "tx_json": {
                            "Account": "rwx5qckmiUPoqvRnGWy7uyJM3RFW2VXJjE",
                            "Amount": 50000000,
                            "Destination": "rptHRGQHzH2bPBeW9rJ12YknynzTDrKrNG",
                            "TransactionType": "Payment",
                            "SourceTag": "94765320"
                            // "DestinationTag": "94765320"
                        },
                        "fee_mult_max": 1000
                    }
                ]
            },
            // headers: {
            //     'Content-Type': 'application/json',
            // },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = await rp.post(options);

        let return_hash = ret.result.tx_json.hash;
        let transaction = await GetTransaction(return_hash)
    } catch (error) {
        console.log(error.stack);
        
    }
}

//Start();
//  GetTransaction("5EDA0427205C0AB30CB6D46BF4BDAC4B9CEF100FB6BF117BF4A9C6EA49D68E00");

for (let i = 0; i < 1; i++) {
    SignAndSubmit();
}

