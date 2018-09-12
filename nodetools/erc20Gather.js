// 运行方式 node erc20Gather.js development  /  node erc20Gather.js production   
var request = require('request');
var http = require("https");
var readYaml = require('read-yaml');
var mysql = require('mysql');
const fs = require('fs');
var sleep = require('sleep');
var async = require('async');
var just = require('string-just');
var web3 = require('web3')
var log4js = require('log4js');
var gatherHis = require('./gatherHistory')

log4js.configure({
	appenders: { gather: { type: 'file', filename: '../../log/gather.log' } },
    categories: { default: { appenders: ['gather'], level: 'debug' } }
})
var logger = log4js.getLogger('gather');
logger.level = 'debug';

var utils = web3.utils

//读取所有的配置文件配置 

var environment = 'development'
//console.log(process.argv)
if(process.argv.length > 2){
	process.argv.lenght;
	
	environment = process.argv[2]
}
//console.log(environment);

var config ={};
var currencies = [];
var gasPrice = 40
var gasString = ""
var databaseCfg = {
        		host: 'localhost',
        		user: 'root',
        		password: 'nextpwd',
        		database: 'peatio_development'
    			}

readYaml('config.yml', function(err, data) {
		if (err) throw err;
		config = data[environment];
		//logg(config);
		readOtherConfig();
	});


async function readOtherConfig(){
	gasPrice = config.base_gas_price;
	gasString = utils.toHex(utils.toWei(gasPrice.toString(), 'shannon'));

	currencies = await readCurrencyCfg();
	dbc = await readDatabaseCfg();
	if(dbc.host){
		databaseCfg.host = dbc.host;
	}
	else{
		databaseCfg.host = dbc.address;
	}
	databaseCfg.user = dbc.username;
	databaseCfg.password = dbc.password;
	databaseCfg.database = dbc.database;
	console.log(databaseCfg);

	await gatherHis.start(databaseCfg);
	
	queryTransactions()
}

async function readCurrencyCfg(){
	return new Promise((resolve,reject) => {
		readYaml('../../config/currencies.yml', function(err, data) {
			if (err) reject(err);
			currencies = data;
			//logg(currencies);
			resolve(data);
		});
	})
}

async function readDatabaseCfg(){
	return new Promise((resolve,reject) => {
		readYaml('../../config/database.yml', function(err, data) {
			if (err) reject(err);
			logg(data[environment]);
			resolve(data[environment]);
		});
	})
}

var waitingTrans = []
let EthGas = 0.000021  //21000 Gwei
let ERC20Gas = 0.00006 //60000 Gwei

function queryTransactions(){
	//查询数据库，找出所有非已到账的记录
	let limit = config.deal_limit;
	
	var connection = mysql.createConnection(databaseCfg);
	connection.connect();
	connection.query('SELECT * FROM `payment_transactions` where collected = false and currency in (4,5) limit ' + limit, function (err, results, fields) {
	        if (err) throw err
			logg("Find " + results.length + " payment transactions need deal.")
	        waitingTrans = results;
			dealOneWaitingTrans()
	    });
	connection.end();
	
}

async function dealOneWaitingTrans() {
	if(waitingTrans.length == 0 ){
		for(var i = 0; i < 8 ; i++){
			sleep.sleep(60*30);//等待30分钟
			logg("Gather is waiting");
		}
		queryTransactions();
		return ;
	}
	//取出一个并处理
	var payment = waitingTrans.shift();
	var address = payment.address;
	var id = payment.currency;
	var ethCrn = currencies[1]
	
	//console.log("xx");
	if(id == 3){// 是ETH
		var eth = await queryEth(address)
		logg("Start deal address: " + address + " with eth: "  + eth);
		var ethWallet = ethCrn.main_wallet
		if (eth > EthGas * gasPrice){
			sendBackEth(address,ethWallet,eth,ethCrn.password)
		}
		else {
			makePaymentCollected(payment)
		}
	}
	else {//普通的ERC20
		let time = await gatherHis.lastCheckTime(address);
		if(time){
			if (new Date() - time < 3600*4*1000){
				logg("Address: " + address + " have dealed at: " + time);
				dealOneWaitingTrans();
				return;
			}
		}
		
		var currency
		for (var i = 0; i < currencies.length; i++) {
			if(currencies[i].id == id){
				currency = currencies[i];
				break;
			}
		}
		let contract = currency.contract_address
		//query eth,query erc20
		let eth = await queryEth(address)
		let erc20 = await queryErc20(address, contract)
		logg("Start deal " + currency.code + " address: " + address + ' It has eth: ' + eth + ' erc20: ' + erc20);
		//4种情况分别处理
		let ethWallet = config.gas_wallet
		let ethPassword = config.gas_wallet_pwd
		let tokenWallet = currency.main_wallet
		let tokenPassword = currency.password
		if(erc20 >= 100){//erc20太少了，不值得处理
			if (eth >= ERC20Gas * gasPrice){
				sendBackToken(address,tokenWallet,contract,erc20,tokenPassword)
			}
			else {
				sendGas(ethWallet,address,eth,ethPassword)
			}
		}
		else {
			if (eth > EthGas * gasPrice * 2){//有足够多的ETH值得转回来
				sendBackEth(address,ethWallet,eth,tokenPassword)
			}
			else {//ETH不多，留着下次用吧
				makePaymentCollected(payment)
			}
		}
		//更新该地址的处理时间
		await gatherHis.saveCheckTime(address);
	}
	//等待后处理下一个
	sleep.sleep(1);
	dealOneWaitingTrans();
}

async function queryEth(address) {
    	var opt = {
    		uri: config.parity_url,
  			method: 'POST',
		  json: {
		    "method":"eth_getBalance",
		    "params":[address],
		    "id":address,
		    "jsonrpc":"2.0"
		  },
    	}
	return new Promise((resolve,reject) => {
		request(opt,function (error,response,body){
			if (error) reject(error)
			var ns = utils.hexToNumberString(response.body.result)
			var value = utils.fromWei(ns,'ether')
			resolve(value);
		});
	});
}

async function queryErc20(address,contract) {
	var options = {
	  "method": "GET",
	  "hostname": config.erc20_query_host,
	  "port": null,
	  "path": "/balance/"+contract+"/"+address
	};
	return new Promise((resolve,reject) => {
		var req = http.request(options, function (res) {
			var chunks = [];

			res.on("data", function (chunk) {
				chunks.push(chunk);
			});

			res.on("end", function () {
				var body = Buffer.concat(chunks);
				//这是ERC20的值
			    var v = parseFloat(body);
			    resolve(v)
			});
		});
		req.end();
	});
}

//从主ETH钱包发邮费
function sendGas(from,to,remain,password) {
	let value = Math.ceil((ERC20Gas * gasPrice - remain)*1000000)/1000000
	logg("Send gas from " + from + " to " + to + " with: " + value)
	let valueStr = utils.toHex(utils.toWei(value.toString(),'ether'))
	var opt = {
    	uri: config.parity_url,
  		method: 'POST',
		json: {
			"method":"personal_sendTransaction",
			"params":[
			{
				"from":from,
				"to":to,
				"value":valueStr,
				"gasPrice":gasString,
				},
				password
			],
		    "id":"send gas",
		    "jsonrpc":"2.0",
		  	},
    	}
	console.log(opt.json)
	logger.debug(opt.json)
    request(opt,function (error,response,body){
		console.log(response.body)
		logger.debug(response.body)
	});
}

//在有足够邮费的情况下，发回ERC20
function sendBackToken(from,to,contract,value,password) {
	logg("Send token back from " + from + " to " + to + " with: " + value)
	d1 = "0xa9059cbb"
	d2 = utils.padLeft(to.substring(2,42),64,'0')
	d3 = just.rjust((value * 1000000000000000000).toString(16),64,'0')
	data = d1 + d2 + d3
	var opt = {
    	uri: config.parity_url,
  		method: 'POST',
		json: {
			"method":"personal_sendTransaction",
			"params":[
			{
				"from":from,
				"to":contract,
				"data":data,
				"gasPrice":gasString,
				"gas": '0xEA60'  //60000
				},
				password
			],
		    "id":"back token",
		    "jsonrpc":"2.0",
		  	},
    	}
	console.log(opt.json)
	logger.debug(opt.json)
    request(opt,function (error,response,body){
		console.log(response.body)
		logger.debug(response.body)
	});
}

//可能的情况下，转回多余的ETH
function sendBackEth(from,to,value,password) {
	let remain = Math.floor((value - EthGas * gasPrice)*1000000)/1000000
	logg("Send eth back from " + from + " to " + to + " with: " + value)
	let valueStr = utils.toHex(utils.toWei(remain.toString(),'ether'))
	var opt = {
    	uri: config.parity_url,
  		method: 'POST',
		json: {
			"method":"personal_sendTransaction",
			"params":[
			{
				"from":from,
				"to":to,
				"value":valueStr,
				"gasPrice":gasString,
				"gas":'0x5208' //21000
				},
				password
			],
		    "id":"back gas",
		    "jsonrpc":"2.0",
		  	},
    	}
	console.log(opt.json)
	logger.debug(opt.json)
    request(opt,function (error,response,body){
		console.log(response.body)
		logger.debug(response.body)
	});
}

function makePaymentCollected(payment){
	logg("Done! ID: " + payment.id + " Address " + payment.address + " has finish gather!")

	var connection = mysql.createConnection(databaseCfg);
	connection.connect();
	connection.query('Update `payment_transactions` set collected = true where id = ' + payment.id, function (err, results, fields) {
		if (err) throw err
	})
	connection.end();

}

function logg(msg){
	logger.info(msg);
	console.log(msg);
}
