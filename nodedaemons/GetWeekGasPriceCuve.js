const Web3 = require('web3');
const baseConvert = require('baseconvert');
const fs = require('fs');
const logger = require('./common/logger/logger.js');
const readYaml = require('read-yaml');
const path = require('path');
const when = require('when');
const amqp = require('./common/amqp');
const Algorithm = require('./Algorithm');
const async = require('async');
const ethereum = require('./common/ethereum');
const util = require('./common/util');

let config_path = path.join(__dirname, '../nodetools/config.yml');
let currency_config = path.join(__dirname, '../../config/currencies.yml');
let amqp_config = path.join(__dirname, '../../config/amqp.yml');
let mySql = require(path.join(__dirname, './common/mysql'));

let environment = "development";
let interval = 15*60*1000; // 15 minutes
let block_generated_time = 12 * 1000; // 12 seconds
let period = 7*24*60*60*1000; // 7 days
let concurrency_number = 10;

let web3;
if(process.argv.length > 2){
    environment = process.argv[2]
}

/**
 * 
 */
let GetWeekGasPriceCuve = async function() {
    let DebugTag = logger.DebugTag("GetWeekGasPriceCuve");
    let ErrorTag = logger.ErrorTag("GetWeekGasPriceCuve");
    console.log(DebugTag, "Scan block starting");
    logger.info(DebugTag, "Scan block starting");
    try {
        let gas_price_cuve_array = [];
        let parity_url = GetParityUrl();
        //web3 = new Web3(new Web3.providers.HttpProvider(parity_url));
        var now = new Date().getTime();
        var total_blocks = period / block_generated_time;
        var total_interval_block = interval / block_generated_time;
        //let last_block_number = await GetLastBlockNumber();
        let last_block_number = await ethereum.GetLastEthBlockNum(parity_url);
        //last_block_number = 3304914;
        //let pivot_block_number = last_block_number;
        //let  i = 0;
        // while(i < total_blocks) {
        //     for (let j=last_block_number; j>0; j--) {
        //         i++;
        //         if (i===0 || (i+1)%total_interval_block===0) {
        //             let interval_count = (i+1)/total_interval_block;
        //             let end_block = last_block_number - interval_count * total_interval_block;
        //             let start_block = last_block_number - (interval_count + 1) * total_interval_block + 1;
        //             let timestamp = now - interval_count * period;
        //             let median = await Getmedian(start_block, end_block);
        //             //await Getmedian(3290786, 3290789);
        //             //Getmedian(start_block, end_block);
        //             console.log(`The median form ${start_block} to ${end_block} is ${median}`)
        //             logger.info(`The median form ${start_block} to ${end_block} is ${median}`)
        //             gas_price_cuve_array.push({timestamp: timestamp, median: median});
        //         }
        //     }
        // }
   
        let i = 0;     
        while(i<total_blocks) {
            let concurrency_array = [];
            let index = concurrency_number;

            // setInterval(function() {
            //     web3 = new Web3(new Web3.providers.HttpProvider(parity_url));
            // }, 30000);
            
            for (let j=0;j<index;j++) {
                i += total_interval_block;
                let end = last_block_number - j*total_interval_block;
                let timestamp = now - (i/total_interval_block) * interval;
                let start = last_block_number - (j+1)*total_interval_block+1;
                let scan_interval = {timestamp: timestamp, start: start, end: end};
                concurrency_array.push(scan_interval);
            }
            logger.info(JSON.stringify(concurrency_array));
            let result = await GetConcurrencyMedian(parity_url, concurrency_array);
            gas_price_cuve_array = gas_price_cuve_array.concat(result);
            logger.info(JSON.stringify(gas_price_cuve_array));
        }
        logger.info("result >>> " + JSON.stringify(gas_price_cuve_array));
    } catch (error) {
        console.log(ErrorTag, error.stack);
        logger.info(ErrorTag, error.stack);
    }
}

let GetConcurrencyMedian = async function(parity_url, concurrency_array) {
    return new Promise((resolve, reject) => {
        async.mapLimit(concurrency_array, concurrency_number, async function(item) {
            return await GetMedian(parity_url, item ,item.start, item.end);
        }, (err, results) => {
            if (err) reject(err);
            resolve(results);
        })
    })
}

let GetParityUrl =  function() {
    let DebugTag = logger.DebugTag("GetParityUrl");
    let ErrorTag = logger.ErrorTag("GetParityUrl");

    let parity_config = readYaml.sync(config_path);
    if (parity_config[environment] && parity_config[environment].parity_url) { 
        return parity_config[environment].parity_url;
    }  else {
        //logger.info(ErrorTag, "No valid parity url");
        console.log(ErrorTag, "No valid parity url");
        return;
    }
}

let GetLastBlockNumber = async function() {
    try {
        return await web3.eth.getBlockNumber();
    } catch (error) {
        throw error;
    }
}

let GetMedian = async function(parity_url, item, start_block, end_block) {
    let DebugTag = logger.DebugTag("GetWeekGasPriceCuve");
    let ErrorTag = logger.ErrorTag("GetWeekGasPriceCuve");
    let gas_price_arr = [];
    let block_pivot, trans_index_pivot;
    try {
        for (let i=start_block; i<=end_block; i++) {
            block_pivot = i;                
            // let block_hash = await GetBlockHashByBlockNumber(i)
            // let trans_count = await GetTransCountByBlockHash(block_hash);
            let block_num_base16 = util.ConvertFrom10To16(i);
            let block = await ethereum.GetEthByBlockNum(parity_url, block_num_base16);
            let block_hash = block.hash;
            let trans_count = await ethereum.GetBlockTransCountByHash(parity_url, block_hash);
            for (let index=0; index<trans_count; index++) {
                trans_index_pivot = index; 
                //let transaction = await GetTransactionFromBlock(block_hash, index);
                let transaction = await ethereum.GetTransByBlockHashAndIndex(parity_url, block_hash, index);
                let gas_price = await GetGasPrice(transaction);
                if (gas_price) gas_price_arr.push(gas_price);
            }
            console.log(DebugTag, `Completed scan block number ${i}`);
            logger.info(DebugTag, `${i}'s hash is ${block_hash}`)
            logger.info(JSON.stringify(item), ` >>>> Completed scan block number ${i}`);
        }

        logger.error(item, JSON.stringify(gas_price_arr));
        let median = Algorithm.CalculateMedian(gas_price_arr);
        logger.error("The median is >>>>>>>>> ", median);
        logger.error("------------------------------------------------------------ ------------------- ");
        let timestamp = new Date(item.timestamp);
        return {timestamp: timestamp, median: median}
    } catch (error) {
        logger.info(`Block number ${block_pivot} transaction index ${trans_index_pivot} throw an error : ` + error.stack)
        throw error;
    }
}

let GetBlockHashByBlockNumber = async function(blockNumber) {
    try {
        let block = await web3.eth.getBlock(blockNumber);
        if (block && block.hash) {
            return block.hash;
        } else {
            throw new Error(`Block number ${blockNumber} does not exist block hash.`);
        }
    } catch (error) {
        throw error;
    }
}

let GetTransCountByBlockHash = async function(hash) {
    try {
        return await web3.eth.getBlockTransactionCount(hash);
    } catch (error) {
        throw error;
    }
}

let GetTransactionFromBlock = async function(hash, index) {
    try {
        return await web3.eth.getTransactionFromBlock(hash, index);
    } catch (error) {
        logger.info(`GetTransactionFromBlock function throw an error at HASH = ${hash} and INDEX = ${index}.`);
        throw(error);
    }
}

let GetGasPrice = async function(transaction) {
    //todo for elend coin
    try {
        if (transaction && transaction.value) {
            return baseConvert.converter(transaction.value).fromBase(16).toBase(10)/(Math.pow(10, 18));
        }
    } catch (error) {
        throw error;
    }
}



GetWeekGasPriceCuve();