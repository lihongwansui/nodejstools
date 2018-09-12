var request = require('request');
var http = require("https");
var readYaml = require('read-yaml');
const mysqlssh = require('mysql-ssh');
const fs = require('fs');
var sleep = require('sleep');

var currencies = [];
readYaml('../../../config/currencies.yml', function(err, data) {
  if (err) throw err;
  //console.log(data[3].contract_address);
  currencies = data;
  //console.log(currencies);
});

var parityUrl = 'http://10.35.11.56:8545';
var dAdds = [[],[],[],[]];

function queryAllIcons(){
	queryAllAddress();
	
}

function queryAllAddress(){
	mysqlssh.connect(
	    {
	        host: '10.35.21.34',
	        user: 'user',
	        password: '123456'
	    },
	    {
	        host: 'localhost',
	        user: 'root',
	        password: 'nextpwd',
	        database: 'peatio_development'
	    }
	)
	.then(client => {
		//用户充值，用户余额，用户提现，交易手续费，提现手续费
		client.query('SELECT * FROM `payment_addresses`', function (err, results, fields) {
	        if (err) throw err
	        //console.log(results)
	        for(i = 0 ; i < results.length ; i++){
	        	var da = results[i];
	        	var idx = parseInt(da.currency) - 2;
	        	if(idx >=0 && idx < dAdds.length){
	        		if(da.address != null && da.address.length>20){
	        			dAdds[idx].push(da.address)
	        		}
	        	}
	        }
	        
	        mysqlssh.close()
	       	//console.log(dAdds[1]);
			//console.log(dAdds[2]);
			//console.log(dAdds[3]);
			console.log(currencies.length);
			for(var i = 0; i < currencies.length; i++){
				var currency = currencies[i];
				console.log(i);
				console.log(currency.code);
				if (currency.code == 'btc'){
					queryBTC(currency);
				}
				else if (currency.code == 'eth'){
					//queryETH(currency);
				}
				else{
					console.log("Haha");
					queryERC20(currency);
				}
			}
	    })    
	})
	.catch(err => {
	    console.log(err)
	})
}



function queryBTC(currency){

}


function queryETH(currency){
	var adds = dAdds[1]
	var ethSum = 0.0;
	var count = 0;
    for(i = 0; i< adds.length; i++){
    	var address = adds[i];
    	var opt = {
    		uri: parityUrl,
  			method: 'POST',
			  json: {
			    "method":"eth_getBalance",
			    "params":[address],
			    "id":address,
			    "jsonrpc":"2.0"
			  },
    	}

    	request(opt,function (error,response,body){
			 var value0x = response.body.result
			 var value  = parseInt(value0x,16)/1000000000000000000
			 var add = response.body.id
			 if (value > 0){
			 	console.log(add + " have " +value )
			 	ethSum += value
			 }
			 count += 1
			 if(count == adds.length){
			 	console.log("Total eth: " + ethSum)
			 }
		});
    }
}

function queryERC20(currency){
	var adds = dAdds[parseInt(currency.id) - 2];
	var contract = currency.contract_address;
	
	var sum = 0.0;
	var count = 0;
	for(i = 0; i < adds.length; i++){
		var options = {
		  "method": "GET",
		  "hostname": "test.tokenbalance.com",
		  "port": null,
		  "path": "/balance/"+contract+"/"+adds[i]
		};

		var req = http.request(options, function (res) {
		  var chunks = [];

		  res.on("data", function (chunk) {
		    chunks.push(chunk);
		  });

		  res.on("end", function () {
		    var body = Buffer.concat(chunks);
		    console.log(body.toString());
		    var v = parseFloat(body.balance);
		    if( v > 0){
		    	sum += v;
		    }
		    count += 1
		    if(count == adds.length){
		    	console.log("Total " + currency.code + " : " + sum);
		    }
		  });
		});

		req.end();
	}
}

queryAllIcons();
