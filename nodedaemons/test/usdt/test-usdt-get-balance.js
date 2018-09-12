const request = require('request');
let url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.21.64:18332";
let propertyid = 2147484866;

let GetBalance = async function() {
    try {
        let system_account = "mu4oY9weytr9NkQwFgWKYLL16T67X19VpX";
        let orign_account = "muQoXJW2jkkpMVy3xiceeyEbHerjYDkhHm";
        let origin2 = "mqCATJrP2RizZSeqFWMJoQ1uQF2ZLZmDqA";
        let origin3 = "ms2V5qsJiwFNt3hm38N5BM4Fj2LPikkx9P";
        let options = {
            uri: url,
            body: {
                "method": "omni_getbalance",
                params: [orign_account, propertyid]
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

GetBalance();