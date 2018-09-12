const amqp = require('amqplib');
const path = require('path');
const logger = require(path.join(__dirname,'../logger/logger.js'));
let amqp_config = path.join(__dirname, '../../../config/amqp.yml');
const readYaml = require('read-yaml');

let environment = 'development'  

if(process.argv.length > 2){
	environment = process.argv[2]
}  

let GetAMQPOptions = function() {
    let amqp_options;
    if (environment==='development') {
        amqp_options = "amqp://localhost"
    } else {
        let parity_config = readYaml.sync(amqp_config);
        amqp_options = parity_config.connect;
    }
    return amqp_options;
}

var SendAMQPQueue = function(temp_trans) {     
    let DebugTag = logger.DebugTag("SendAMQPQueue");
    let amqp_options = GetAMQPOptions();
    return new Promise (async function(resolve, reject) {
        let conn, channel;
        let q = 'peatio.deposit.coin';
        try {
            let amqp_options = GetAMQPOptions();
            conn = await amqp.connect(amqp_options);
            let channel = await conn.createChannel();
    
            channel.assertQueue(q,{durable: false}).then(function(_qok){
                for (let i=0; i<temp_trans.length; i++) {
                    let msg = JSON.stringify(temp_trans[i]);
                    channel.sendToQueue(q, Buffer.from(msg));
                    console.log(DebugTag, `Send ${msg} to amqp.`);
                    logger.info(DebugTag, `Send ${msg} to amqp.`);
                }
                
                resolve({status: 1});
            });
        } catch (error) {
            console.log(DebugTag, error.stack);
            logger.info(DebugTag, error.stack);
            resolve({status: 0});
        } finally {
            if (conn && channel) {
                channel.close();
                conn.close();
            }
        } 
    });
}

exports.SendAMQPQueue = SendAMQPQueue;