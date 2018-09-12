const rp = require('request-promise');
// let url = "https://s.altnet.rippletest.net:51234";
// let url = "https://s.altnet.rippletest.net:51234";

// let url = "http://54.248.65.153:51235";
let url = "http://10.35.0.57:51235";


let Start = async function() {
    try {
        let options = {
            uri: url,
            body: {
                "method":"account_tx",
                "params": [
                    {
                        "account":  "rHo2sSzP9maFey8JNHXEKJnDzcqhqEcZYp",//"rptHRGQHzH2bPBeW9rJ12YknynzTDrKrNG",  //"rHo2sSzP9maFey8JNHXEKJnDzcqhqEcZYp",//
                        "binary": false,
                        "forward": true,
                        "ledger_index_max": -1,
                        "ledger_index_min": 40623528, //11551664,  
                        "limit": 1,
                        // "marker": undefined//{"ledger":11550544,"seq":25}
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
        let ret = await rp.post(options);
        console.log(">>>>>>>>> >>>>>>>>>>>>> >>>>>>>>>");
        // ret.result.transactions.length
        console.log(JSON.stringify(ret));
        // console.log(JSON.stringify(ret.result.marker));
        
        // ret.result.transactions.map((item) => {
        //     console.log(JSON.stringify(item.tx));
        // })
        // console.log(JSON.stringify(ret));
        
    } catch (error) {
        console.log(error.stack);
    }
}


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

Start();