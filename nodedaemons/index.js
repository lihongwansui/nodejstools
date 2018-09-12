// 运行方式 node index development  /  node index production
const rp = require('request-promise');
//const redis = require("redis");
const baseConvert = require('baseconvert');
const fs = require('fs');
const logger = require('./common/logger/logger.js');
const readYaml = require('read-yaml');
const path = require('path');
const when = require('when');
const amqp = require('./common/amqp'); 
const dateformat = require('dateformat');
const util = require('./common/util');

let config_path = path.join(__dirname, '../config/config.yml');
let backup_path = path.join(__dirname, "./backupfolder/eth_backup_number.txt");
let currency_config = path.join(__dirname, '../config/currencies.yml');
let amqp_config = path.join(__dirname, '../config/amqp.yml');
let mySql = require(path.join(__dirname, './common/mysql'));
let mySqlPromise = require(path.join(__dirname, './common/mysql/wraptransaction'));
let config = require(path.join(__dirname, './common/config/config'));

let recent_queue_length = 6000;
let recent_queue_array = [];
let target_Trans_Count = 0;
let isSync = false;
let environment = 'development';
let isExistedMedianColumn = false;

let SyncParityDaemon = async function() {
    let DebugTag = logger.DebugTag("SyncParityDaemon");
    let ErrorTag = logger.ErrorTag("SyncParityDaemon");
    try {
        if(process.argv.length > 2){
            environment = process.argv[2]
        }

        logger.info(DebugTag, "Sync parity node starting");
        console.log(DebugTag, "Sync parity node starting");
        // get parity url
        let parity_url = GetParityUrl();
        if (!parity_url) {
            console.log("No valid parity url");
            logger.info(ErrorTag, "No valid parity url");        
            return;
        }
    
        await SyncParityNodes(parity_url);
        setInterval(async function() {
            if (!isSync) {
                await SyncParityNodes(parity_url);
            }
        }, 12000);
    } catch (error) {
        console.log(ErrorTag, error.stack);
        logger.info(ErrorTag, error.stack);
        setTimeout(() => {
            SyncParityDaemon();
        }, 12000);
    }
}

let GetAMQPOptions = function() {
    let parity_config = readYaml.sync(amqp_config);
    return parity_config.connect;
}

let GetParityUrl =  function() {
    let DebugTag = logger.DebugTag("GetParityUrl");
    let ErrorTag = logger.ErrorTag("GetParityUrl");

    let parity_config = readYaml.sync(config_path);
    if (parity_config[environment] && parity_config[environment].parity_url) { 
        return parity_config[environment].parity_url;
    }  else {
        logger.info(ErrorTag, "No valid parity url");
        return;
    }
}

let SyncParityNodes = async function(parity_url) {
    let DebugTag = logger.DebugTag("SyncParityNodes");
    let ErrorTag = logger.ErrorTag("SyncParityNodes");

    try {
        isSync = true;
        // get backup block number
        let backup_block_number = ReadBlockNumber(backup_path);
        let last_block_number = await GetEthBlockNumber(parity_url);
		console.log(`Backup block number is ${backup_block_number}.`);
        console.log(`The last block number is ${last_block_number}.`);  
        
        // query all valid eth accounts
        let sql_scripts = "SELECT * FROM `payment_addresses` Where currency = 3 order by id desc";
        let eth_accounts = await mySql.QueryDB(sql_scripts);
        console.log(DebugTag, `The length of eth accounts form db is ${eth_accounts.length}.`);

        
        let scripts = "SELECT  id, txid,aasm_state,fee,sum,account_id,member_id FROM `withdraws` where aasm_state = 'almost_done'";
        let withdraw_items = await mySql.QueryDB(scripts);
        console.log(DebugTag, `The length of monitor txids form db is ${withdraw_items.length}.`);
        let erc20_accounts = GetERC20Counts();
        console.log(`erc20 accounts length is >>> >> > ${erc20_accounts.length}`);

        logger.info(DebugTag, `Backup block number is ${backup_block_number}.`);
        logger.info(DebugTag, `The last block number is ${last_block_number}.`);
        if (backup_block_number && !isNaN(Number(backup_block_number))) {
            let backup_number = parseInt(backup_block_number);
            if (backup_number < last_block_number) {
                for (let index = backup_number+1; index <= last_block_number-3; index++) {
                    await SyncBlock(parity_url, index, eth_accounts, erc20_accounts, withdraw_items);                
                    BackupBlcokNumber(backup_path, index);
                    console.log(DebugTag, `Scan blcok number ${index} successfully.`);
                    logger.info(DebugTag, `Scan blcok number ${index} successfully.`);
                }
            } else { // backup_block_number is larger than last block number
                console.log("Noted: backup block number is not less than the last block number.");
                logger.info(DebugTag, `Backup block number is not less than the last block number.`);
            }        
        } else {
            logger.info(ErrorTag, `Backup file not contain backup block number.`);
        }
        isSync = false;
    } catch (error) {
       throw error;
    }
    
}

let SyncBlock = async function(parity_url, eth_block_number, eth_accounts, erc20_accounts, withdraw_items) {
    let DebugTag = logger.DebugTag("SyncBlock");

    try {
        let gas_price_array = [];
        let eth_block_number_base16 = baseConvert.converter(eth_block_number).fromBase(10).toBase(16);
        let block_hash = await GetEthBlockByNumber(parity_url, eth_block_number_base16);
        logger.info(DebugTag, `${eth_block_number}'s block hash is ${block_hash}.`);
        let block_transaction_count = await GetBlockTransCountByHash(parity_url, block_hash);
        var total_count =  baseConvert.converter(block_transaction_count).fromBase(16).toBase(10);
        
        let temp_trans = [];
        let transactions_array = []; // all transaction in the same block
        for (let index = 0; index < total_count; index++) {

            let transaction_index = baseConvert.converter(index).fromBase(10).toBase(16);
            let transaction = await GetTransByBlockHashAndIndex(parity_url, block_hash, `0x${transaction_index}`);
            transactions_array.push(transaction.hash);
            
            let price = Number.parseInt(transaction.gasPrice)/(Math.pow(10, 9)); 
            //gas_price_array.push(price);
            PushGasToRecentTransArray(price);
            let targetTran = await GetTargetTran(parity_url, eth_block_number_base16, eth_accounts, erc20_accounts, transaction);
            
            if (targetTran && targetTran.txid) {
                target_Trans_Count ++;
                temp_trans.push(targetTran);
                console.log(DebugTag, `target transaction count is ${target_Trans_Count}.`);
                logger.info(DebugTag, `target transaction count is ${target_Trans_Count}.`);
            };
        }
        await MonitorTransaction(withdraw_items, transactions_array);

        if (temp_trans.length > 0) {
            let result = await amqp.SendAMQPQueue(temp_trans);
            while (!result.status) { // If amqp server is block, wait 10 seconds and send amqp again.              
                await TimeOut(10000);
                result = await amqp.SendAMQPQueue(temp_trans);
            }
        }

        let median = GetMedianGasPrice(recent_queue_array);
        if (median) { // if median is undefined, do not update median column.
            if (parseFloat(median) > 36) {
                console.log(`Median gas price is ${median}, update to 36`);
                median = 36;
            } else if (parseFloat(median) < 5) {
                console.log(`Median gas price is ${median}, update to 5`);
                median = 5;
            }
            let now = new Date();
            let now_at = dateformat(now, config.Date_Formate);

            let update_median_script;
            if (isExistedMedianColumn) { 
                update_median_script = "update `"+config.Global_Configs_Table+"` set value = "+median+", updated_at = '"+now_at+"' where name = '"+ config.Gas_Price_Median_Column+"'";
            } else {
                let query_configs_script = "select * from `"+config.Global_Configs_Table+"` where name = '"+ config.Gas_Price_Median_Column+"'";
                let result = await mySql.QueryDB(query_configs_script);
                if (result && result.length > 0) {
                    update_median_script = "update `"+config.Global_Configs_Table+"` set value = "+median+", updated_at = '"+now_at+"' where name = '"+ config.Gas_Price_Median_Column+"'";
                } else { // not exist median column
                    let median_column_array = [config.Gas_Price_Median_Column, median, config.Gas_Price_Median_Des, now_at, now_at];
                    update_median_script = "INSERT INTO `"+config.Global_Configs_Table+"`  (`name`, `value`, `desc_txt`, `created_at`, `updated_at`) VALUES ("+ util.ConvertArrayToString(median_column_array)+")";
                }
                isExistedMedianColumn = true;
            }
            console.log(DebugTag, `Block number ${eth_block_number}'s median gas price is ${median}`);
            logger.info(DebugTag, `Block number ${eth_block_number}'s median gas price is ${median}`);
            await mySql.QueryDB(update_median_script);
        }
        
    } catch (error) {
        throw error;
    }
}

let GetMedianGasPrice = function(gas_price_array) {
    let arr = [].concat(gas_price_array);
    let sort_array = arr.sort(function(pre, current) {
        return pre - current;
    })
    if (sort_array.length == 0) return undefined;

    let median_index = Number.parseInt(sort_array.length/3);
    return sort_array[median_index];
}

let MonitorTransaction = async function(withdraw_items, transactions_array) {
    let DebugTag = logger.DebugTag("MonitorTransaction");
    let ErrorTag = logger.ErrorTag("MonitorTransaction");
    try {
        // 
        let monitor_transactions = [];
        for (let i = 0; i < withdraw_items.length; i ++) {
            for(let j = 0; j < transactions_array.length; j++) {
                if (withdraw_items[i].txid === transactions_array[j]) {
                    monitor_transactions.push(withdraw_items[i]);
                }
            }
        }

        for(let index = 0; index < monitor_transactions.length; index ++) {
            let monitor_item = monitor_transactions[index];           
            let account = await GetAccount(monitor_item.account_id);
            let locked_withdraw_av = await GetLockedWithdrawAV(monitor_item.id);
            let last_account_version = await GetLastAccountVersion(monitor_item.member_id, monitor_item.account_id);
            
            let locked = account.locked - monitor_item.sum;
            let now = new Date();
            let now_at = dateformat(now, config.Date_Formate);
            // update withdraws aasm_state and done_at
            let update_withdraws_script = "update `withdraws` set aasm_state = 'done' , done_at = '"+now_at+"' where id =" + monitor_item.id;

            let amount = last_account_version.amount - locked_withdraw_av.locked;
            let account_version = [monitor_item.member_id, monitor_item.account_id, config.Withdraw_Reason_Code, 0, locked_withdraw_av.balance, monitor_item.fee, amount, monitor_item.id, 'Withdraw', now_at, now_at, locked_withdraw_av.currency, config.Unlock_And_Sub_Funds];

            let update_account_script = "update `accounts` set  locked = "+locked+" where id = " + account.id;
            let add_account_version_script = "INSERT INTO `account_versions` (`member_id`, `account_id`, `reason`, `balance`, `locked`, `fee`, `amount`, `modifiable_id`, `modifiable_type`, `created_at`, `updated_at`, `currency`, `fun`) VALUES ("+util.ConvertArrayToString(account_version)+")";
            let result = await mySqlPromise.QueryDBPromise([update_withdraws_script, update_account_script, add_account_version_script]);
            if (result.status === 1) {
                console.log(DebugTag, `Monitor withdraws ${monitor_item.id} successfully.`);
                logger.info(DebugTag, `Monitor withdraws ${monitor_item.id} successfully.`);
            }
        }
    } catch (error) {
        throw(error);
    }
}

let GetAccount = async function(account_id) {
    try {
        let query_account_script = "SELECT * FROM `accounts` where id = " + account_id + " order by id desc";
        let account_list = await mySql.QueryDB(query_account_script);
        if (account_list && account_list.length > 0) {
            return account_list[0];
        } else {
            throw new Error(`Account list length is less than 0 for account id ${account_id} at GetAllAccount function`);
        }
    } catch (error) {
        console.log(error.stack);
        throw error;
    }
}

/**
 * @method GetLockedWithdrawAccountVersion 
 * @param withdraw_id 
 */
let GetLockedWithdrawAV = async function(withdraw_id) {
    try {
        let account_version_script = "SELECT * FROM account_versions where modifiable_id = "+withdraw_id+" and modifiable_type = 'Withdraw' order by id desc";
        // get all account version items by withdraw id.
        let account_versions = await mySql.QueryDB(account_version_script);
        if (account_versions && account_versions.length > 0) {
            return account_versions[0]
        } else {
            throw new Error(`Account versions length is less than 0 for withdraw id ${withdraw_id} at GetLockedWithdrawAV function`);
        } 
    } catch (error) {
        console.log(error.stack);
        throw error;
    }
}

let GetLastAccountVersion = async function(member_id, account_id) {
    try {
        let account_version_script = "SELECT * FROM account_versions where member_id = "+member_id+" and account_id = "+account_id+" order by id desc";
        let account_versions = await mySql.QueryDB(account_version_script);
        if (account_versions && account_versions.length > 0) {
            return account_versions[0]
        } else {
            throw new Error(`Account versions length is less than 0 for member_id = ${member_id} & account_id = ${account_id} at GetLockedWithdrawAV function`);
        } 
    } catch (error) {
        console.log(error.stack);
        throw error;
    }
}

let TimeOut = async function(ms) {
    await new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

let ReadBlockNumber = function(backup_path) {
    return fs.readFileSync(backup_path, 'utf8');
}

let BackupBlcokNumber = function (backup_path, block_number) {
    fs.writeFileSync(backup_path, block_number, 'utf8');
}

let GetEthBlockNumber = async function(parity_url) {
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_blockNumber",
            "params":[],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        var eth_block = await rp.post(options);
        return baseConvert.converter(eth_block.result).fromBase(16).toBase(10);
    } catch (error) {
        throw error;
    }
}

let GetEthBlockByNumber = async function(parity_url, eth_block_number) {   
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getBlockByNumber",
            "params":[`0x${eth_block_number}`,true],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        var eth_block = await rp.post(options);
        if (eth_block&& eth_block.result && eth_block.result.hash) {
            return eth_block.result.hash;
        } else {
             throw new Error(`Block number ${eth_block_number} does not exist block hash.`);
        }
    } catch (error) {
        throw error;
    }
}

let GetBlockTransCountByHash = async function(parity_url, block_hash) {
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getBlockTransactionCountByHash",
            "params":[`${block_hash}`],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        var block_trans_Count = await rp.post(options);
        if (block_trans_Count.result || block_trans_Count.result===0) {
            return block_trans_Count.result;
        } else {
            throw new Error(`Block hash ${block_hash} does not exist transctions.`);
        }
    } catch (error) {
        throw error;
    }
}

let GetTransByBlockHashAndIndex = async function(parity_url, block_hash, index) {
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getTransactionByBlockHashAndIndex",
            "params":[`${block_hash}`, `${index}`],
            "id":1,
            "jsonrpc":"2.0"
        },
        headers: {
            'Content-Type': 'application/json',
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    try {
        let transaction = await rp.post(options);
        if (transaction && transaction.result) {
            return transaction.result;
        } else {
            throw new Error(`Current transaction is not existed.`);
        }
    } catch (error) {
        throw error;
    }
}

let GetERC20Counts = function () {
    let target_currencies = [];
    let currencies = readYaml.sync(currency_config);
    if (currencies && currencies.length>0) {
        target_currencies = currencies.filter(function(currency) {
            return currency.code === 'elend' || currency.code === 'chu';
        })
    }
    return target_currencies;
}

let GetTargetTran = async function(parity_url, eth_block_number_base16, eth_accounts, erc20_accounts, transaction) {
    try {
        let erc20_array = erc20_accounts.filter(function(account) {
            if (account.contract_address && transaction.to && transaction.input) {
                let fun_tag = transaction.input.slice(0, 10);
                return account.contract_address.toLowerCase()===transaction.to.toLowerCase() && fun_tag==="0xa9059cbb";
            }
        })
        if (erc20_array && erc20_array.length>0 ) {
            let to_address = '0x' + transaction.input.slice(34, 74);
            let sql_scripts = "SELECT * FROM `payment_addresses` Where currency = "+erc20_array[0].id+" and address = '" +to_address+"'  order by id desc";
            let erc20_from_db = await mySql.QueryDB(sql_scripts);
            if (erc20_from_db && erc20_from_db.length>0) {
                                
                let result = await DoubleCheckTransacton(parity_url, eth_block_number_base16, erc20_array[0], transaction.hash); 
                if (result) {
                    return GetERC20Tran(transaction, erc20_array[0].code, erc20_array[0].decimal);
                } else {
                    console.log("Filter invalid transaction >>>> >>> >>>>> >>>> " + transaction.hash);
                    logger.info("Filter invalid transaction >>>> >>> >>>>> >>>> " + transaction.hash);
                }
            }
        }
    
        let eth_array = eth_accounts.filter(function(account) {
            return account.address === transaction.to && transaction.to;
        })
        if (eth_array && eth_array.length>0 ) {
            return GetEthTran(transaction);
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
        let receipt = await rp.post(options);       
        if (receipt && receipt.result) {
            return receipt.result;
        } else {
            return undefined;
        }
    } catch (error) {
        throw error;
    }
}

let GetERC20Tran = function(transaction, channel_key, decimal) {
    try {
        let erc20_transaction = Object.create(null);
        erc20_transaction.contract_address = transaction.to;
        erc20_transaction.channel_key = channel_key;
        erc20_transaction.txid = transaction.hash;
        var address_base64 = transaction.input.slice(34, 74);
        erc20_transaction.address = '0x' + address_base64;
        var value_base64 = transaction.input.slice(74, 138)
        erc20_transaction.value = baseConvert.converter(value_base64).fromBase(16).toBase(10)/(Math.pow(10, decimal));

        return erc20_transaction;
    } catch (error) {
        throw error;
    }
}

let GetEthTran = function(transaction) {
    try {
        let eth_transaction = Object.create(null);
        eth_transaction.channel_key = 'eth';
        eth_transaction.txid = transaction.hash;
        eth_transaction.address = transaction.to;
        eth_transaction.value = baseConvert.converter(transaction.value).fromBase(16).toBase(10)/(Math.pow(10, 18));

        return eth_transaction;
    } catch (error) {
        throw error;
    }
}

let DoubleCheckTransacton = async function(parity_url, block_number, erc20_item, trans_hash) {
    try {
        let list = await FilterTransByTopic(parity_url, block_number, erc20_item);
        let result = list.filter((item) => {
            return item.transactionHash == trans_hash;
        }); 
        if (!result || result.length === 0) return false;

        let receipt = await GetTransactionReceipt(parity_url, trans_hash);
        if (receipt && receipt.status == 0x1) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
}

let FilterTransByTopic = async function(parity_url, block_number, erc20_item) {    
    var options = {
        uri: parity_url,
        body: {
            "method":"eth_getLogs",
            "params":[{"fromBlock": `0x${block_number}`, "toBlock": `0x${block_number}`,"address": erc20_item.contract_address}],
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
        return transaction_list.result;
    } catch (error) {
        throw error;
    }
}

let PushGasToRecentTransArray = function(gas_price) {
    if (recent_queue_array.length == recent_queue_length) {
        recent_queue_array.shift();
    } 

    recent_queue_array.push(gas_price);
    //logger.info(`Recent trancations gas price is ${JSON.stringify(recent_queue_array)}.`);
}
SyncParityDaemon();