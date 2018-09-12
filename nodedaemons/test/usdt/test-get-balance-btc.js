// bitcoin-cli getbalance "*" 6
let url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.21.64:18332";
const request = require('request');

let Start = async function() {
    try {
        let my_account = "muQoXJW2jkkpMVy3xiceeyEbHerjYDkhHm";
        let system_account = "mu4oY9weytr9NkQwFgWKYLL16T67X19VpX";
        let options = {
            uri: url,
            body: {
                "method": "getbalance",
                params: [system_account, 1]
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = await RequestUrl(options);
        console.log(JSON.stringify(ret));
    } catch (error) {
        console.log(error.stack);
    }
}

let RequestUrl = async function(options) {
    return new Promise((resolve, reject) =>{
        request.post(options, (e, r, body) => {
            if (e) {
                reject(e);
            } else {
                resolve(body)
            }
        });
    });
}

Start();