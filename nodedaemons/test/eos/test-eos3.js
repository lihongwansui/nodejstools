let eos_url = "http://10.35.11.56:8888";
// let eos_url = "http://52.194.120.158:8888"; 
// let eos_url = "http://eosnetworkmonitor.io:8888";
// let eos_url = "http://104.27.171.103:443";
// let eos_url = "http://eos-rpc.tc.ink";
let EosApi = require('eosjs');

let trasns_hash = "7ee5f9d427207f5cb782caa8e38f097c572c9dbc8e7f04c165c794665fe8e597";

let account_name = "";
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
        eos.getActions(account_name,(error, ret) => {
            if (error) {
                console.log(error.stack);
            } else {
                console.log(ret);
            }
        });
    })
}

let GetTransaction = async function(eos, ) {
    return new Promise((resolve, reject) => {
        eos.getTransaction(trasns_hash, (error, ret) => {
            if (error) {

            } else {
                // console.log(JSON.stringify(ret));
                let last_irreversible_block = ret.last_irreversible_block;
                console.log("last irreversible block is  >>> " + last_irreversible_block);
                let blcok_num = ret.block_num;
                console.log("block number is >>> " + blcok_num);                
            }
        })
    })
}

Start();