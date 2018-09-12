const amqp = require('amqplib');
const path = require('path');
let amqp_config = path.join(__dirname, '../../../config/amqp.yml');
const readYaml = require('read-yaml');

let environment = 'development'  

if(process.argv.length > 2){
	environment = process.argv[2]
}  

var SendAMQPQueue = function(msg) {     
    let amqp_config = {
        hostname: "193.112.195.120",
        port: 5672,
        username: 'guest',
        password: 'guest'
    }
    // let amqp_config = {
    //     hostname: "10.35.21.167",
    //     port: 5672,
    //     username: 'bitcoind',
    //     password: 'glority'
    // }
    return new Promise (async function(resolve, reject) {
        let conn, channel;
        let q = 'peatio.deposit.command';
        try {
            conn = await amqp.connect(amqp_config);
            let channel = await conn.createChannel();
    
            channel.assertQueue(q,{durable: true}).then(function(_qok){
                let item = JSON.stringify(msg);
                console.log(item);
                
                channel.sendToQueue(q, Buffer.from(item));
            });
        } catch (error) {
            console.log(DebugTag, error.stack);
        } finally {
            if (conn && channel) {
                channel.close();
                conn.close();
            }
        } 
    });
}

let msg = {txid: "886ea283196c71bbd4bb59ef1f96e6fe2510b832721f4632069735d0088bec22", coin: 'usdt'};

for (let i = 0; i<2; i++) {
     SendAMQPQueue(msg);
 }

