const request = require('request');
let url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.0.57:18332";
// let propertyid = 2147484866;
let propertyid = 31;

let ListProperty = async function() {
    try {
        let options = {
            uri: url,
            body: {
                "method": "omni_getproperty",
                "params": [propertyid]
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

ListProperty();