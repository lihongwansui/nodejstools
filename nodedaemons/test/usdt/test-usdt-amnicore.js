const rp = require('request-promise');
// const url = "https://api.omniexplorer.info";
// const url = "https://live.blockcypher.com/";
// const url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.11.56:18332";
const url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.0.57:18332"
let base_url = "http://10.35.0.57:18332";

let Start = async function(hash) {
    try {
        let options = {
            uri: url,
            body: {
                "method": "omni_gettransaction",
                "params": [hash]
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        let {e, r, body} = await rp.post(options);
        // rp.post(options, (e, r, body) => {
        //     console.log(">>> " + JSON.stringify(body));
        // });
       
    } catch (error) {
        console.log(">> <<<" + error.stack);
    }
}

let TestComond = async function() {
    try {
        let options = {
            uri: url,
            body: {
                "method": "omni_getinfo",
            },
            // oauth: {
            //     user: "nextstep",
            //     password: "so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs="
            // },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = await rp.post(options);
        console.log('>>>' + JSON.stringify(ret));
    } catch (error) {
        console.log(error.stack);
        
    }
}

let TestGetAllTransactions = async function() {
    try {
        let options = {
            uri: base_url,
            body: {
                method: "omni_listtransactions",
            },
            auth: {
                user: "nextstep",
                password: "so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs="
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = await rp.post(options);
        console.log('>>>' + JSON.stringify(ret.result));
    } catch (error) {
        console.log(error.stack);
    }
}

let TestGetAllTransactionsByBlock = async function() {
    try {
        let options = {
            uri: base_url,
            body: {
                method: "omni_listblocktransactions",
                params: [279007]
            },
            auth: {
                user: "nextstep",
                password: "so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs="
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = await rp.post(options);
        console.log('>>>' + JSON.stringify(ret));
    } catch (error) {
        console.log(error.stack);
        
    }
}

let TestSendUSDTTransaction = async function() {
    try {
        let options = {
            uri: base_url,
            body: {
                method: "omni_send",
                params: ["3M9qvHKtgARhqcMtM5cRT9VaiDJ5PSfQGY", "37FaKponF7zqoMLUjEiko25pDiuVH5YLEa", 1, 20]
            },
            auth: {
                user: "nextstep",
                password: "so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs="
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = await rp.post(options);
        console.log('>>>' + JSON.stringify(ret));
    } catch (error) {
        console.log(error.stack);
        
    }
}


let hash = "d54213046d8be80c44258230dd3689da11fdcda5b167f7d10c4f169bd23d1c01";
let hash01 = "63d7e22de0cf4c0b7fd60b4b2c9f4b4b781f7fdb8be4bcaed870a8b407b90cf1"
let hash02 = "7244beac4e5165b3386728f2cd4c203dd6144b6676853e5012a87b75135468b0"
Start(hash01);

// TestComond();
// TestGetAllTransactions();

// TestGetAllTransactionsByBlock();

// TestSendUSDTTransaction();

