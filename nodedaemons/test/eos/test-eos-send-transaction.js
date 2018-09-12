let eos_url = "http://10.35.11.56:8888";
let EosApi = require('eosjs');


let Init = async function() {
    try {
        let options = {
            httpEndpoint: eos_url,
            verbose: false,
            chainId: "038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca",
            keyProvider: "5KGTxkiJ5PTQGFjNEf1XqnzidCcBHutzJLQVjVqXBBfqNcPkL3Q",
            sign: true,
            broadcast: true,
            fetchConfiguration: {}
        };   
        let eos = EosApi(options);
        // eos.getInfo((err, ret) => {
        //     if (err) {
        //         console.log(error.stack);
        //     } else {
        //         console.log(JSON.stringify(ret));
        //     }
        // });
        eos.transfer({from: 'tianma', to: 'chubideposit', quantity: '11.0000 EOS', memo: '624901'}, (error, ret) => {
            if (error) {
                throw error;
            }
            else {
                console.log(`The result is >>> > ${JSON.stringify(ret)}`);
            }                
        })
    } catch (error) {
        console.log(`The error is ${error.stack}`);
    }
}

Init();