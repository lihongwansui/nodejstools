const request = require('request');
// let url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.0.57:18332";

let url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.21.64:18332";

let propertyid = 2147484866;

let SendCoins = async function() {
    try {
        let system_account = "mu4oY9weytr9NkQwFgWKYLL16T67X19VpX";
        let my_account = "muQoXJW2jkkpMVy3xiceeyEbHerjYDkhHm";
        let out_account = "2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF";
        let qiao_account = "n4dU4tCQhVDzsCqXBgijn7sPWvLerCSJ5y";
        let qiao_account2 = "ms2V5qsJiwFNt3hm38N5BM4Fj2LPikkx9P";
        let origin3 = "ms2V5qsJiwFNt3hm38N5BM4Fj2LPikkx9P";
        let options = {
            uri: url,
            body: {
                "method": "omni_send",  //"omni_send",  "omni_funded_send",
                params: [system_account, my_account, propertyid, '1']
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


let GetCachedFees = async function() {
   try {
        let options = {
            uri: url,
            body: {
                "method": "omni_getfeecache",
                params: [propertyid]
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        request.post(options, (e, r, body) => {
            if (e) {
                throw e;
            } else {
                console.log(JSON.stringify(body));
            }
        });
   } catch (error) {
       console.log(erro.stack);
       
   }
}

// GetCachedFees();
SendCoins();