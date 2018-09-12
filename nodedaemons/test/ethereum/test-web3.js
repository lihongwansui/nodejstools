const {expect} = require('chai');
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://10.35.11.56:8540"));
let parity_url = "http://10.35.11.56:8540";
const rp = require('request-promise');


// describe("Test Web3 Package", function() {
//    it("Get Block Number", async function() {
//         let blockNumber = 3304914;
//         let block = await web3.eth.getBlock(blockNumber);
//         let transaction_count = await web3.eth.getBlockTransactionCount(block.hash);
//         expect(transaction_count).to.equal(24);
//    });
// });

let Init = async function() {
    let block_number = "0x35d326";
    let next_block_number = "0x35d327";
    let trans_hash = "0xe6e551b17934953037fd826cd0e73c527b987e53004b1f31ec495fb9591c3ffa";
    let ret = await web3.eth.getTransaction(trans_hash);
    console.log(JSON.stringify(ret));
    
    //await FilterByTopic(parity_url, block_number, next_block_number);
    // web3.eth.net.getNetworkType().then(console.log);
}

let FilterByTopic = async function(parity_url, block_number, next_block_number) {
    //0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getLogs",
            "params":[{"fromBlock": block_number, "toBlock": block_number,"address":"0xbd684b55a091d877787076db74d3929834fb6ca4"}],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        let transaction_list = await rp.post(options);
        
        if (transaction_list && transaction_list.result && transaction_list.result.length > 0) {
            for (var i = 0; i < transaction_list.result.length; i++) {
                console.log(JSON.stringify(transaction_list.result[i].transactionHash));
                let result  = await GetTransactionReceipt(parity_url, transaction_list.result[i].transactionHash);
                console.log(JSON.stringify(result.result.status == 0x1));
            }
        }
    } catch (error) {
        throw error;
    }
}

let GetTransactionReceipt = async function(parity_url, trans_hash) {
    let options = {
        uri: parity_url,
        body: {
            "method":"eth_getTransactionReceipt",
            "params":[trans_hash],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    }
    try {
        return await rp.post(options);       
    } catch (error) {
        throw error;
    }
}

Init();