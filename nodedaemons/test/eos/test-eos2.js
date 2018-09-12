let eos_url = "http://10.35.11.56:8888";
// let eos_url = "http://52.194.120.158:8888"; 
// let eos_url = "http://eosnetworkmonitor.io:8888";
// let eos_url = "http://104.27.171.103:443";
// let eos_url = "http://eos-rpc.tc.ink";

// let eos_url = "http://52.194.120.158:8888";
let EosApi = require('eosjs');

let realy_trasns_hash = "fc313ce59bde24d26fb52097b90458ee20d5708afdfa7c0094c74d0224fc93c0";
let trasns_hash = "dc6f29e9f5acd4f6b0b2ba49efa151514692ac4c5b14a756a580b2ef92339d94";
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

        eos.getTransaction(trasns_hash, (error, ret) => {
            if (error) {

            } else {
                // console.log(JSON.stringify(ret));
                let last_irreversible_block = ret.last_irreversible_block;
                console.log("last irreversible block is  >>> " + last_irreversible_block);
                let blcok_num = ret.block_num;
                console.log("block number is >>> " + blcok_num);   
                
                console.log(ret && ret.trx && ret.trx.receipt && ret.trx.receipt.status === "executed");
                
            }
        })

        // eos.getActions("chubideposit",60, 2,(error, ret) => {
        //     if (error) {
        //         console.log(error.stack);
        //     } else {
        //         // console.log(JSON.stringify(ret.actions[0].action_trace.inline_traces));
        //         console.log(JSON.stringify(ret.actions[0].action_trace.act.data));
        //         console.log(JSON.stringify(ret.actions[0].action_trace.trx_id));
                
        //         console.log('>>>>>');
        //         console.log(JSON.stringify(ret.actions.length));
        //         console.log('------');
                
        //         // console.log(JSON.stringify(ret.actions));
        //         // console.log(JSON.stringify(ret.actions.map(a => a.action_trace)))
        //         //console.log(JSON.stringify(ret.actions.map(a => a)))
        //         // console.log('---- ---- ----- -- -- - -- -');
        //     }
        // });

        


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