const request = require('request');
let url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.21.64:18332";
let propertyid = 2147484866;

// new main address: msum3aJtDWoYm4Fpo6xr31e9S2b4r6TenV

let GetNewAddress = async function() {
    try {
        let system_account = "mu4oY9weytr9NkQwFgWKYLL16T67X19VpX";
        let my_account = "muQoXJW2jkkpMVy3xiceeyEbHerjYDkhHm";
        let out_account = "2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF";
        let options = {
            uri: url,
            body: {
                "method": "getnewaddress",
            },
            // auth: auth,
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

GetNewAddress();