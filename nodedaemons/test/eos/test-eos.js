const rp = require('request-promise');
// let eos_url = "http://52.194.120.158:8888"; 
let eos_url = "http://10.35.11.56:8888";
let EosApi = require('eosjs');

let callback = (err, result)=>{
    err ? console.log(err.stack) : console.log(JSON.stringify(result));
}

let start = async function() {
    let options = {
        httpEndpoint: eos_url,
        // chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
        chainId: "038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca",
        keyProvider: "5HvpGpRhM4YSF3pJ3CJGgJgeMbxNgaw3JnwaWJT6LunhxarLv2w",
        broadcast: true,
        verbose: false,
        fetchConfiguration: {}
    }
    try {
        let eos = EosApi(options);
        eos.transfer('chubideposit', 'wuhualiang', '1.0000 EOS', '',(error, ret) => {
            if (error) {
                console.log(error.stack);
            } else {
                console.log(JSON.stringify(ret));
            }
        })

        // eos.getAccount('chubideposit', (error, ret) => {
        //     if (error) {
        //         console.log(error.stack);
                
        //     } else {
        //         console.log(JSON.stringify(ret));
                
        //     }
        // });
        // let node_info = await GetNodeInfo(eos); 
        // console.log(JSON.stringify(node_info));
        // console.log(">>>> >>> >>> ");
        // let blcok_info = await GetBlockInfo(eos, 1568397); //node_info.last_irreversible_block_id
        // // console.log(JSON.stringify(blcok_info));
        // let trans_list = blcok_info.transactions;
        // console.log(JSON.stringify(trans_list));

        // let actions = eos.getActions((error, ret) => {
        //     if (error) {
        //         console.log(error.stack);
        //     } else {
        //         console.log(JSON.stringify(ret));
        //     }
        // });

        // let trasns_hash = "92b8bcfd9b7ead0c6dcd9c2eb772727d2209038060767ba8bcaf93191dd927f3";
        // eos.getTransaction(trasns_hash, (err, ret) => {
        //     err ? reject(err) : resolve(ret);
        // })
        

        //eos.getBlockHeaderState(7276630, callback)
    } catch (error) {
        console.log(`>>> > ${error.stack}`);
    }
};

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
        eos.getActions("eosukblocpro", (error, ret) => {
            if (error) {
                console.log(error.stack);
            } else {
                console.log(ret);
            }
        });
    })
}

start();