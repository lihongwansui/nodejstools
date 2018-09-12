let url = "https://api.omniexplorer.info/v1/properties/gethistory/3";
const rp = require('request-promise');

let Init = async function() {
    try {
        let options = {
            uri: url,
            body: {
                "params": [
                    {
                        "page": 0
                    }
                ],
                "id":1,
                "jsonrpc":"2.0"
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = await rp.post(options);
        console.log(ret);
    } catch (error) {
        console.log(">>> " + error.stack);
    }
}

Init();