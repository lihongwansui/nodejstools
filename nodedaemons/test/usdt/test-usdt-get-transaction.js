const request = require('request');
const test_url = "http://10.35.0.57:18332";
const hash = "206572c427ea3b6205f5fdfc77636813c88225c3950316538df3aa255e44e4cf";
let hash01 = "886ea283196c71bbd4bb59ef1f96e6fe2510b832721f4632069735d0088bec22";
let hash02 = "97f23fc13d78b6ba93042140be7bd728530b91b9a27f5b81ae3faea6e28779c4";
let url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.21.64:18332";

let Start = async function() {
    try {
        auth = {
            user: "nextstep",
            password: "so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs="
        };
        
        let options = {
            uri: url,
            body: {
                "method": "omni_gettransaction",
                params: [hash]
            },
            // auth: auth,
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        let ret = request.post(options, (e, r, body) => {
            if (e) {
                throw e;
            } else {
                // console.log("...." + JSON.stringify(r));
                
                console.log(">>>?>" + JSON.stringify(body));
            }
            
        });
    } catch (error) {
        console.log(error.stack);
    }
}

Start();

// let url = "http://nextstep:so5d9gF3_jkFkkmPCH2c_3GbA1TG1JJyQUyOLqpmKzs=@10.35.0.57:18332";
let TestComond = async function() {
    try {
        
        let options = {
            url: test_url,
            body: {
                "method": "omni_getinfo",
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
        let ret = request.post(options, (e, r, body) => {
            if (e) {
                throw e;
            } else {
                console.log(">>>?>" + JSON.stringify(body));
            }
            
        });
    } catch (error) {
        console.log(error.stack);
        
    }
}

// TestComond();