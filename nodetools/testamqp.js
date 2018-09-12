var q1 = 'deposit_coin';
var q2 = 'peatio.deposit.coin';

var url = {
	host: '127.0.0.1',
	port: 5672,
	username: 'bitcoind',
	password: 'glority'
}

var open = require('amqplib').connect(url);
 
// Publisher
open.then(function(conn) {
	return conn.createChannel();
}).then(function(ch) {
	return ch.assertQueue(q).then(function(ok) {
		ch.sendToQueue(q1, {channel_key: 'elend',txid: 'txid1' ,address: 'address 1', value: 1});
		return ch.sendToQueue(q2, {channel_key: 'elend',txid: 'txid2' ,address: 'address 2', value: 2});
	});
}).catch(console.warn);
 
