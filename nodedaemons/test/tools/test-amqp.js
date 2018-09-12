const amqp = require('amqplib');

let q = "peatio.deposit.command";
let amqp_config = {
    hostname: "10.35.21.167",
    port: 5672,
    username: 'bitcoind',
    password: 'glority'
}

    // hostname: "193.112.195.120",
    // port: 5672,
    // username: 'guest',
    // password: 'guest'

amqp.connect(amqp_config).then(function(conn){
    process.once('SIGN',function(){
      conn.close();
    });
    
    return conn.createChannel().then(function(ch){
      //设置公平调度，这里是指rabbitmq不会向一个繁忙的队列推送超过1条消息。
      ch.prefetch(1);
      //监听队列q并消费
      var ok = ch.assertQueue(q,{durable: true}).then(function(){
        ch.consume(q,((msg) => {
            console.log("Already come in ... " + msg.content.toString());
            // Init(JSON.parse(msg.content));
            ch.ack(msg);
        }),{noAck:false});
      });
      return ok.then(function(){
        console.log(' [*] waiting for message')
      })
    })
}).then(null,console.error);