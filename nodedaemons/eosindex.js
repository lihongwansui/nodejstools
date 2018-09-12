// 运行方式 node index development  /  node index production
const fs = require('fs');
const logger = require('./common/logger/logger.js');
const readYaml = require('read-yaml');
const path = require('path');
const amqp = require('./common/amqp'); 
const dateformat = require('dateformat');
const util = require('./common/util');
const EosApi = require('eosjs');

let config_path = path.join(__dirname, '../config/config.yml');
let backup_path = path.join(__dirname, "./backupfolder/eos_backup_number.txt");
let currency_config = path.join(__dirname, '../config/currencies.yml');
let mySql = require(path.join(__dirname, './common/mysql'));
let mySqlPromise = require(path.join(__dirname, './common/mysql/wraptransaction'));
let config = require(path.join(__dirname, './common/config/config'));

let interval = 9
let isSync = false;
let environment = 'development';

let SyncEOSDaemon = async function() {
    let DebugTag = logger.DebugTag("SyncEOSDaemon");
    let ErrorTag = logger.ErrorTag("SyncEOSDaemon");
    try {
        if(process.argv.length > 2){
            environment = process.argv[2]
        }

        logger.eosinfo(DebugTag, "Sync eos node starting");
        console.log(DebugTag, "Sync eos node starting");
        // get parity url
        let eos_config = GetEOSConfig();
        if (!eos_config || !eos_config.eos_url || !eos_config.eos_main_account) {
            console.log("No valid EOS configuration");
            logger.eosinfo(ErrorTag, "No valid EOS configuration");        
            return;
        }
        let options = {
            httpEndpoint: eos_config.eos_url,
            verbose: false,
        }
        let EOS = EosApi(options);
        await SyncEOSNodes(EOS, eos_config.eos_main_account);
        setInterval(async function() {
            if (!isSync) {
                await SyncEOSNodes(EOS, eos_config.eos_main_account);
            }
        }, 5000);
    } catch (error) {
        console.log(ErrorTag, error.stack);
        logger.eosinfo(ErrorTag, error.stack);
        setTimeout(() => {
            SyncEOSDaemon();
        }, 12000);
    }
}

let GetEOSConfig =  function() {
    return readYaml.sync(config_path)[environment];
}

let SyncEOSNodes = async function(EOS, eos_main_account) {
    let DebugTag = logger.DebugTag("SyncEOSNodes");
    let ErrorTag = logger.ErrorTag("SyncEOSNodes");
    console.log(">>>> >>> >>>");
    try {
        isSync = true;
        // get backup block number
        let backup_number = ReadBackupNumber(backup_path);
        let start_number = Number(backup_number) + 1;
        
        let all_actions = await GetAllActions(EOS, eos_main_account, start_number, interval);
        logger.eosinfo(`${eos_main_account}'s all action length is ${all_actions.length}`);
        let traget_trans_list = [];
        for (let i = 0; i < all_actions.length; i++) {
            let action = all_actions[i];
            console.log(DebugTag, ` >>> > > Current acction number is ${start_number + i}.`);
            logger.eosinfo(DebugTag, ` >>> > > Current action number is ${start_number + i}.`);
            let is_deposit = await CheckIsDeposit(action, eos_main_account);
            if (is_deposit) {
                let is_irreversible = false;
                while (!is_irreversible) {
                    let trans = await GetTransaction(EOS, action.action_trace.trx_id);
                    // check transaction status
                    if (trans && trans.trx && trans.trx.receipt && trans.trx.receipt.status === "executed") {
                        // current_block_number is less than last_irreversible_block 
                        if (trans && trans.last_irreversible_block && trans.block_num && trans.last_irreversible_block <= trans.block_num) {
                            console.log(`Wait trasaction hash ${action.action_trace.trx_id} to be irreversibled.`);
                            logger.eosinfo(`Wait trasaction hash ${action.action_trace.trx_id} to be irreversibled.`);
                            await TimeOut(12000);
                            is_irreversible = false;
                        } else {
                            is_irreversible = true;
                            let target_trans = await GetTargetTrans(action);
                            traget_trans_list.push(target_trans);
                        }
                    } else {
                        is_irreversible = true;
                    }
                }
            }
        }   
        console.log(DebugTag + "Pending sending to amqp list is " + JSON.stringify(traget_trans_list.length));
        
        if (traget_trans_list.length > 0) {
            let result = await amqp.SendAMQPQueue(traget_trans_list);
            while (!result.status) { // If amqp server is block, wait 10 seconds and send amqp again.    
                await TimeOut(10000);
                result = await amqp.SendAMQPQueue(traget_trans_list);
            }
        }
        let temp_interval = Number(interval)+1 == all_actions.length ? Number(interval)+1 : all_actions.length;
        backup_number = Number(backup_number)+temp_interval;
        BackupBlcokNumber(backup_path, backup_number);

        // Withdraw
        let withdraw_items = await GetWithdrawItems();
        console.log(DebugTag + `withdraw account length is ${withdraw_items.length}`);
        await MonitorTransaction(withdraw_items, EOS);
        isSync = false;
    } catch (error) {
       throw error;
    }
}

let GetWithdrawItems = async function() {
    let scripts = "SELECT  id, txid,aasm_state,fee,sum,account_id,member_id FROM `withdraws` where aasm_state = 'almost_done' and currency = '8'";
    return await mySql.QueryDB(scripts);;
} 

let GetAllActions = async function(eos, eos_main_account, start_number, interval) {
    return new Promise((resolve, reject) => {
        eos.getActions(eos_main_account, start_number, interval, (error, ret) => {
            if (error) {
                reject(error);
            } else {
                resolve(ret.actions);
            }
        });
    })
}

let CheckIsDeposit = async function(action, eos_main_account) {
    try {
        if (action && action.action_trace && action.action_trace.act && action.action_trace.act.data && action.action_trace.act.data.to && action.action_trace.act.data.to === eos_main_account) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
}

let DoubleCheckTransaction = async function(EOS, trans_hash) {
    try {
        // receipt status
        let trans = await GetTransaction(EOS, trans_hash);
        if (trans && trans.trx && trans.trx.receipt && trans.trx.receipt.status === "executed") {
            // current_block_number is less than last_irreversible_block 
            if (trans && trans.last_irreversible_block && trans.block_num && trans.last_irreversible_block >= trans.block_num) {
                return true;
            }
        } 
        return false;
    } catch (error) {
        throw error;
    }
}

let GetTransaction = async function(EOS, trans_hash) {
    return new Promise((resolve, reject) => {
        EOS.getTransaction(trans_hash, (error, ret) => {
            if (error) {
                reject(error);
            } else {
                resolve(ret);
            }
        })
    });
}

let GetTargetTrans = async function(action){
    try {
        let target_trans = {};
        target_trans.channel_key = "eos";
        target_trans.txid = action.action_trace.trx_id;
        target_trans.address = action.action_trace.act.data.memo;
        let value_list = action.action_trace.act.data.quantity.split(' ');
        target_trans.value = parseFloat(value_list[0]);
    
        return target_trans;   
    } catch (error) {
        throw error;
    }
}


let MonitorTransaction = async function(withdraw_items, eos) {
    let DebugTag = logger.DebugTag("MonitorTransaction");
    let ErrorTag = logger.ErrorTag("MonitorTransaction");
    try {
        let monitor_transactions = [];
        for (let i = 0; i < withdraw_items.length; i ++) {
            if (withdraw_items[i].txid) {
                let double_check_status = await DoubleCheckTransaction(eos, withdraw_items[i].txid);
                if (double_check_status) {
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

let ReadBackupNumber = function(backup_path) {
    return fs.readFileSync(backup_path, 'utf8');
}

let BackupBlcokNumber = function (backup_path, block_number) {
    fs.writeFileSync(backup_path, block_number, 'utf8');
}

SyncEOSDaemon();