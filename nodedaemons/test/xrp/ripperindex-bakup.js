const fs = require('fs');
const logger = require('./common/logger/logger.js');
const readYaml = require('read-yaml');
const path = require('path');
const amqp = require('./common/amqp'); 
const dateformat = require('dateformat');
const util = require('./common/util');
const rp = require('request-promise');
const format = require('string-format');
format.extend(String.prototype, {})

let config_path = path.join(__dirname, '../config/config.yml');
let backup_path = path.join(__dirname, "./backupfolder/ripper_backup_number.txt");
let currency_config = path.join(__dirname, '../config/currencies.yml');
let mySql = require(path.join(__dirname, './common/mysql'));
let mySqlPromise = require(path.join(__dirname, './common/mysql/wraptransaction'));
let config = require(path.join(__dirname, './common/config/config'));

let limit = 120;
let isSync = false;
let environment = 'development';
let backup_transaction_hash = "";

let SyncRipperDaemon = async function() {
    let DebugTag = logger.DebugTag("SyncRipperDaemon");
    let ErrorTag = logger.ErrorTag("SyncRipperDaemon");

    try {
        if(process.argv.length > 2){
            environment = process.argv[2]
        }
        logger.ripperinfo(DebugTag, "Sync ripper node starting");
        console.log(DebugTag, "Sync ripper node starting");
        let ripper_config = GetRipperConfig(config_path);
        let base_url = ripper_config.ripper_url;
        let account_name = ripper_config.ripper_main_account;

        await SyncRipperNodes(base_url, account_name);
        setInterval(async function() {
            if (!isSync) {
                await SyncRipperNodes(base_url, account_name);
            }
        }, 12000);
    } catch (error) {
        console.log(ErrorTag, error.stack);
        logger.ripperinfo(ErrorTag, error.stack);
        setTimeout(() => {
            SyncRipperDaemon();
        }, 12000);
    }
}

let SyncRipperNodes = async function(base_url, account_name) {
    try {
        isSync = true;
        let DebugTag = logger.DebugTag("SyncRipperNodes");
        let ErrorTag = logger.ErrorTag("SyncRipperNodes");
        
        let traget_trans_list = [];

        let backup_time = ReadBackupTimestamp(backup_path);
        console.log(`Backup time >> > ${backup_time}`);
        logger.ripperinfo(DebugTag + `Backup time is ${backup_time}`);
        
        let all_transactions = await GetAccountTransactionHistory(base_url, account_name, limit, backup_time);
        for (let i = 0; i < all_transactions.length; i ++) {
            let transaction = all_transactions[i];
            let is_deposit = await CheckIsDeposit(transaction, account_name);
            if (is_deposit && backup_transaction_hash !== transaction.hash) {
                let target_transaction = await GetTargetTransaction(all_transactions[i]);
                // console.log(">>> >>> " + JSON.stringify(target_transaction));
                
                traget_trans_list.push(target_transaction);
            }
            // backup date timestamp
            if (i === all_transactions.length-1 && typeof(all_transactions[i].date) === 'string') {
                let backup_time = dateformat(all_transactions[i].date, "isoUtcDateTime");
                backup_transaction_hash = all_transactions[i].hash;
                BackupTimestamp(backup_path, backup_time);
            }
        }

        console.log(DebugTag + "Pending sending to amqp list is " + JSON.stringify(traget_trans_list.length));
        logger.ripperinfo(DebugTag + `Pending sending amqp list is ${JSON.stringify(traget_trans_list)}`);

        if (traget_trans_list.length > 0) {
            // let result = await amqp.SendAMQPQueue(traget_trans_list);
            // while (!result.status) { // If amqp server is block, wait 10 seconds and send amqp again.    
            //     await TimeOut(10000);
            //     result = await amqp.SendAMQPQueue(traget_trans_list);
            // }
        }

        // Withdraw
        let withdraw_items = await GetWithdrawItems();
        console.log(DebugTag + `withdraw account length is ${withdraw_items.length}`);
        await MonitorTransaction(withdraw_items, base_url);
        isSync = false;
    } catch (error) {
        throw error;
    }
}

let GetRipperConfig =  function() {
    return readYaml.sync(config_path)[environment];
}

let GetUrlPath = function(base_url) {
    return {
        "GetAllTransactions": base_url + "/v2/accounts/{0}/transactions?type=Payment&result=tesSUCCESS&limit={1}&&&start={2}",
        "GetTransaction": base_url + "/v2/transactions/{0}?binary=false"
    }
}

let GetAccountTransactionHistory = async function(base_url, account, limit, start) {
    try {
        let get_all_trans_url = GetUrlPath(base_url).GetAllTransactions;
        let url = get_all_trans_url.format(account, limit, start);
        let ret = await RequestRipperData(url);
        return ret.transactions;
    } catch (error) {
        throw error;
    }
}

let GetTransaction = async function(base_url, trans_hash) {
    try {
        let get_transaction_url = GetUrlPath(base_url).GetTransaction;
        let url = get_transaction_url.format(trans_hash);
        
        return await RequestRipperData(url);
    } catch (error) {
        throw error;
    }
}

let RequestRipperData = async function(url) {
    try {
        let options = {
            uri: url,
            json: true // Automatically parses the JSON string in the response
        };
        return await rp.get(options)
    } catch (error) {
        throw error;
    }
}

let ReadBackupTimestamp = function(backup_path) {
    return fs.readFileSync(backup_path, 'utf8');
}

let BackupTimestamp = function(backup_path, timestamp) {
    fs.writeFileSync(backup_path, timestamp, 'utf8');
}

let CheckIsDeposit = async function(transaction, account_name) {
    try {
        if (transaction.tx && transaction.tx.Destination  && transaction.tx.Destination === account_name && transaction.tx.Amount && typeof transaction.tx.Amount === 'string' ) {
            return true;
        }
        return false;
    } catch (error) {
        throw error;
    }
}

let GetTargetTransaction = async function(transacton) {
    try {
        let target_trans = {};
        target_trans.channel_key = "xrp";
        target_trans.txid = transacton.hash;
        target_trans.address = transacton.tx.SourceTag;
        target_trans.value = transacton.tx.Amount/(Math.pow(10, 6));
    
        return target_trans;  

    } catch (error) {
        throw error;
    }
}

let TimeOut = async function(ms) {
    await new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

// todo
let GetWithdrawItems = async function() {
    let scripts = "SELECT  id, txid,aasm_state,fee,sum,account_id,member_id FROM `withdraws` where aasm_state = 'almost_done' and currency = '9'";
    return await mySql.QueryDB(scripts);;
} 

let MonitorTransaction = async function(withdraw_items, base_url) {
    let DebugTag = logger.DebugTag("MonitorTransaction");
    let ErrorTag = logger.ErrorTag("MonitorTransaction");
    try {
        let monitor_transactions = [];
        for (let i = 0; i < withdraw_items.length; i ++) {
            if (withdraw_items[i].txid) {
                let double_check_status = await DoubleCheckTransaction(withdraw_items[i].txid, base_url);
                if (double_check_status) {
                    // monitor_transactions.push(withdraw_items[i]);
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

let DoubleCheckTransaction = async function(trans_hash, base_url) {
    try {
        let ret = await GetTransaction(base_url, trans_hash);
        if (ret && ret.transaction && ret.transaction.meta && ret.transaction.meta.TransactionResult === 'tesSUCCESS') {
            return true;
        }
        return false;
    } catch (error) {
        throw error;
    }
}

SyncRipperDaemon();
