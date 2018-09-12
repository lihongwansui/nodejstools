const amqp = require('./common/amqp');

var trans = [{txid: "1231"}, {txid: 44444}, {txid: 6666}];
console.log('111111111');

// amqp.SendAMQPQueue(trans).then(function(data) {
//     console.log(JSON.stringify(data));
// });

var testFun = async function () {
    var result = await amqp.SendAMQPQueue(trans);
    console.log(JSON.stringify(result));
    
}

testFun();