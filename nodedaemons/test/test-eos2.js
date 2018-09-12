let eos_url = "http://10.35.11.56:8888";
// let eos_url = "http://52.194.120.158:8888"; 
// let eos_url = "http://eosnetworkmonitor.io:8888";
// let eos_url = "http://104.27.171.103:443";
// let eos_url = "http://eos-rpc.tc.ink";
let EosApi = require('eosjs');

let trasns_hash = "23354a5e9ec797beda6a0137113d62b9dc8ebd254cc3a2d4d259a54c5eb97f7d";
//chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
let Start = async function() {
    let options = {
        httpEndpoint: eos_url,
        verbose: false,
        // chainId: "038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca",
        // keyProvider: "5K6Tv7x671KXp54Yo15VeFYzY3iycn3fnKj8faXoWcXeXC4wjTn",
        fetchConfiguration: {}
    }
    let callback = (error, ret) => {
        if (error) {
            console.log(error.stack);
        } else {
            console.log(ret);
        }
    }
    try {
        let eos = EosApi(options);
        // let node_info = await GetNodeInfo(eos);
        // console.log(JSON.stringify(node_info));

        // let trasns_hash = "1202d0daf5c82b71555cd44023adac46a42f279f1a20d709db805e8085e6e0ed";
        // let trasns_hash_01 = "123";
        // eos.getTransaction(trasns_hash, (error, ret) => {
        //     if (error) {

        //     } else {
        //         // console.log(JSON.stringify(ret));
        //         let last_irreversible_block = ret.last_irreversible_block;
        //         console.log(last_irreversible_block);
        //         let blcok_num = ret.block_num;
        //         console.log(blcok_num);
        //         console.log(last_irreversible_block > blcok_num);
                
                
        //     }
        // })

        eos.getActions("chubideposit",0,1,(error, ret) => {
            if (error) {
                console.log(error.stack);
            } else {
                // console.log(JSON.stringify(ret.actions[0].action_trace.inline_traces));
                // console.log(JSON.stringify(ret.actions[0].action_trace.act.data));
                console.log('>>>>>');
                
                console.log(JSON.stringify(ret.actions.length));
                console.log(JSON.stringify(ret.actions.map(a => a.action_trace)))
                //console.log(JSON.stringify(ret.actions.map(a => a)))
                // console.log('---- ---- ----- -- -- - -- -');
            }
        });

        


        // eos.getTransaction

        //await GetActions(eos);
        // eos.getTransaction(trasns_hash, (err, ret) => {
        //     err ? reject(err) : resolve(ret);
        // });
        // let result = await eos.getInfo(callback);
        
    } catch (error) {
        console.log(error.stack);
    }
}

let GetNodeInfo = async function(eos) {
    return new Promise((resolve, reject) => {
        eos.getInfo((err, ret) => {
            err ? reject(err) : resolve(ret);
        });
    })
}

let GetBlockInfo = async function(eos, block_id) {
    return new Promise((resolve, reject) => {
        eos.getBlock(block_id, (err, ret) => {
            err ? reject(err) : resolve(ret);
        });
    });
}

let GetActions = async function(eos) {
    return new Promise((resolve, reject) => {
        eos.getActions("wuhualiang",(error, ret) => {
            if (error) {
                console.log(error.stack);
            } else {
                console.log(ret);
            }
        });
    })
}

Start();