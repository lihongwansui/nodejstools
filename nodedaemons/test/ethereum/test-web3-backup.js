const Web3 = require('web3');
const logger = require('../../common/logger/logger.js');
const algorithm = require('../../Algorithm');
// http://10.35.11.214:8545
var web3 = new Web3(new Web3.providers.HttpProvider("http://10.35.11.56:8540"));
let getBlockNumber = async function() {
    var Error_Tag = logger.ErrorTag('getBlockNumber');
    try {
        let gas_price_array = []; 
        var blockNumber = 5707875;//await web3.eth.getBlockNumber();
        var end_blockNumber = 5707891;
        for(let index = blockNumber; index < 5707876; index++) {
            // console.log(">>>" + blockNumber);
            var block = await web3.eth.getBlock(index);
            console.log(block.hash);
            let transaction_count = await web3.eth.getBlockTransactionCount(block.hash);
            console.log(transaction_count);
            var transaction = await web3.eth.getTransactionFromBlock(block.hash, 1)
            console.log(JSON.stringify(transaction));
            // for(let j = 0; j < transaction_count; j ++) {
            //     let transaction = await web3.eth.getTransactionFromBlock(block.hash, j);
            //     //console.log(JSON.stringify(transaction));
                
            //     let gas_price = Number.parseInt(transaction.gasPrice)/(Math.pow(10, 9));
            //     gas_price_array.push(gas_price);

            //     //console.log(JSON.stringify(gas_price_array));
                
            // }
            console.log("Complete scan block number " + index);
        }
        
        //console.log("Gas price array length is " + gas_price_array.length);
        
        let start_at01 = new Date().getTime();
        let sort_gas_price_array = gas_price_array.sort(function(pre, current) {
            return Number.parseInt(pre) - Number.parseInt(current);
        })
        let end_at01 = new Date().getTime();
        console.log(`Sort array by sort fun spend ${(end_at01-start_at01)/60/1000}`);
        
        //console.log(JSON.stringify(sort_gas_price_array));
        let median_index = Number.parseInt(sort_gas_price_array.length/2);
        let result_02 = sort_gas_price_array[median_index];
        console.log("result from sort function is " + result_02);

        var start_at02 = new Date().getTime();
        var result = algorithm.CalculateMedian(gas_price_array);
        var end_at02 = new Date().getTime();
        console.log(`Sort array by algorithm fun spend ${(end_at02-start_at02)/60/1000}`);
        console.log("result from algorithm is " + result);

        
    } catch (error) {
        console.log("Error >>><<<<<<< " + error.stack);
        logger.info(Error_Tag, error.stack);
    }
}

let GetEthBlockByNumber = async function(web3, eth_block_number) {       
    try {
        // var eth_block = await web3.eth.getBlock(eth_block_number);
        // if (eth_block&& eth_block.result && eth_block.result.hash) {
        //     return eth_block.result.hash;
        // } else {
        //      throw new Error(`Block number ${eth_block_number} does not exist block hash.`);
        // }
        throw new Error(`Block number ${eth_block_number} does not exist block hash.`);
    } catch (error) {
        //console.log(error);
        throw error;
    }
}

let getTarget = function () {
    try {
        getError();
    } catch (error) {
        console.log('00000000000000')
        throw error;
    }
}

let getError = function () {
    throw new Error("get target obj is error");
}

getBlockNumber();
//GetEthBlockByNumber();