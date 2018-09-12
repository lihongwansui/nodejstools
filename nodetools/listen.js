var request = require('request');
var readYaml = require('read-yaml');

var log4js = require('log4js');
log4js.configure({
	appenders: { listen: { type: 'file', filename: '../../log/listen.log' } },
    categories: { default: { appenders: ['listen'], level: 'debug' } }
})
var logger = log4js.getLogger('listen');
logger.level = 'debug';
var parityURL = 'ws://10.35.11.56:8546'
var contract = '0xbd684b55a091d877787076db74d3929834fb6ca4'

const WebSocket = require('ws');
 
const ws = new WebSocket(parityURL);
 
ws.on('open', function open() {
	logg('Connect success!')
	data = {
		'method':'eth_subscribe',
		'params':['logs',{'fromBlock':'latest', 'toBlock':'latest', 'address':contract}], 
		'id':2, 
		'jsonrpc':'2.0'}
	ws.send(JSON.stringify(data));
});
 
ws.on('message', function incoming(msg) {
	logg(msg);
	let json = JSON.parse(msg);
	if(json.method == 'eth_subscription'){
		let result = json.params.result;
		console.log(result);
		let txid = result.transactionHash
		let to = '0x' + result.topics[2].substring(26,65)
		let value =  parseInt(result.data,16) / 1000000000000000000
		logg(to + " deposit "+value.toString()+ " in tx "+ txid);
	}
});

ws.on('close', function close() {
	logg('disconnected');
});

function logg(msg){
	console.log(msg);
	logger.debug(msg);
}
