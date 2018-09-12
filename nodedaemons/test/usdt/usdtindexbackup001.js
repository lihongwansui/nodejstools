const fs = require('fs');
const logger = require('./common/logger/logger.js');
const readYaml = require('read-yaml');
const path = require('path');
const amqp = require('./common/amqp'); 
const dateformat = require('dateformat');
const util = require('./common/util');
const rp = require('request-promise');
const request = require('request');
const amqplib = require('amqplib');

let amqp_config_path = path.join(__dirname, '../config/amqp.yml');
let config_path = path.join(__dirname, '../config/config.yml');
let backup_path = path.join(__dirname, "./backupfolder/usdt_backup_number.txt");
let currency_config = path.join(__dirname, '../config/currencies.yml');
let mySql = require(path.join(__dirname, './common/mysql'));
let mySqlPromise = require(path.join(__dirname, './common/mysql/wraptransaction'));
let config = require(path.join(__dirname, './common/config/config'));

let limit = 1000;
let isSync = false;
let environment = 'development';

let SyncUSDTDaemon = async function() {
    let DebugTag = logger.DebugTag("SyncUSDTDaemon");
    let ErrorTag = logger.ErrorTag("SyncUSDTDaemon");

    try {
        if(process.argv.length > 2){
            environment = process.argv[2]
        }
        logger.usdtinfo(DebugTag, "Sync ripper node starting");
        console.log(DebugTag, "Sync ripper node starting");
        let usdt_config = GetUSDTConfig(config_path);
        let base_url = usdt_config.usdt_url;
        let amqp_queue = usdt_config.amqp_queue;
        let amqp_config = GetAMQPOptions();
        StartAMQPListen(amqp_config, amqp_queue);

        await SyncUSDTNodes(base_url);
        setInterval(async function() {
            if (!isSync) {
                await SyncUSDTNodes(base_url);
            }
        }, 6000);
    } catch (error) {
        console.log(ErrorTag, error.stack);
        logger.usdtinfo(ErrorTag, error.stack);
        setTimeout(() => {
            SyncRipperDaemon();
        }, 6000);
    }
}

let SyncUSDTNodes = async function(base_url) {
    let DebugTag = logger.DebugTag("SyncUSDTNodes");
    let ErrorTag = logger.ErrorTag("SyncUSDTNodes");
    try {
        isSync = true;
        let payement_address_list = await GetAllPayementAddress();
        // deposit
        let deposit_trans_list = [];
        let withdraw_trans_list = [];
        //let backup_data = ReadBackupNumber(backup_path);
        let txid_list = await GetMonitorTxidList(); 
        
        for (let i = 0; i < txid_list.length; i ++) {
            let txid = txid_list[i].txid;
            if (!txid) return;

            let transaction = await GetTransaction(base_url, txid);
            let isDeposit = await CheckIsDeposit(transaction, payement_address_list);
            if (isDeposit) {
                let target_trans = GetTargetTransaction(transaction.result);
                deposit_trans_list.push(target_trans)
            } else {
                let isWithdraw = await CheckIsWithdraw(transaction, payement_address_list);
                if (isWithdraw) withdraw_trans_list.push(transaction);
            }
        }
        if (deposit_trans_list.length > 0) {
            logger.usdtinfo(DebugTag, `Sending the followed ${traget_trans_list} to amqp.`);
            let result = await amqp.SendAMQPQueue(traget_trans_list);
            while (!result.status) { // If amqp server is block, wait 10 seconds and send amqp again.    
                await TimeOut(10000);
                result = await amqp.SendAMQPQueue(traget_trans_list);
            }
            backup_data = ReadBackupNumber(backup_path);
            let filtered_data = backup_data.filter((txid) => {
                return txid && !CheckTxidIsExisted(traget_trans_list, txid);
            });
            BackupNumber(backup_path, filtered_data);
        }

        // Withdraw
        // let withdraw_items = await GetWithdrawItems();
        // console.log(DebugTag + `withdraw account length is ${withdraw_items.length}`);
        // await MonitorTransaction(withdraw_items, base_url, payement_address_list);
        isSync = false;
    } catch (error) {
        throw error;
    }
}

let CheckTxidIsExisted = function(traget_trans_list, txid) {
    try {
        return traget_trans_list.some((item) => {
            return item.txid.toLowerCase() == txid.toLowerCase();
        });
    } catch (error) {
        throw error;
    }
}

let GetAMQPOptions = function() {
    let amqp_options = readYaml.sync(amqp_config_path).connect;
    return amqp_options;
}

let StartAMQPListen = function(config, queue) {
    let DebugTag = logger.DebugTag("Listening AMQP");
    let ErrorTag = logger.ErrorTag("Listening AMQP");
    try {
        amqplib.connect(config).then(function(conn){
            process.once('SIGN',function(){
            conn.close();
            });
            
            return conn.createChannel().then(function(ch){
                //设置公平调度，这里是指rabbitmq不会向一个繁忙的队列推送超过1条消息。
                ch.prefetch(1);
                //监听队列q并消费
                var ok = ch.assertQueue(queue,{durable: true}).then(function(){
                    ch.consume(queue,((msg) => {
                        let content = msg.content.toString();
                        console.log(DebugTag, `receive new amqp message ${content}`);
                        logger.usdtinfo(DebugTag, `receive new amqp message ${content}`);
                        // AddBackupNumber(backup_path, content);
                        SaveToDepositHistoryDB();
                        ch.ack(msg);
                    }),{noAck:false});
                });
                return ok.then(function(){
                    console.log('AMQP [*] waiting for message')
                    logger.usdtinfo('AMQP [*] waiting for message');
                })
            })
        }).then(null,console.error);
    } catch (error) {
        throw error;
    }
}

let SaveToDepositHistoryDB = function(coin_id, txid) {
    let DebugTag = logger.DebugTag("Save To Deposit History DB");
    let ErrorTag = logger.ErrorTag("Save To Deposit History DB");
    try {
        let now_at = dateformat(now, config.Date_Formate);
        let depost_history = [coin_id, txid, 0, now_at, now_at];
        let script = "INSERT INTO `monitor_txid_history` (`coin_id`, `txid`, `status`, created_at`, `updated_at`) VALUES ("+util.ConvertArrayToString(depost_history)+")";
        
        mySql.QueryDB(script);
    } catch (error) {
        logger.usdtinfo(DebugTag, error.stack);
    }
}

let GetMonitorTxidList = async function() {
    try {
        let script = "SELECT * FROM `monitor_txid_history` where status = 0;";
        return await mySql.QueryDB(script);
    } catch (error) {
        logger.usdtinfo(DebugTag, error.stack);
    }
}

let GetUSDTConfig =  function() {
    return readYaml.sync(config_path)[environment];
}

let GetTransaction = async function(base_url, trans_hash) {
    try {
        let options = {
            uri: base_url,
            body: {
                "method": "omni_gettransaction",
                params: [trans_hash]
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };
        return new Promise((resolve, reject) => {
            request.post(options, (e, r, body) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(body)
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

let ReadBackupNumber = function(backup_path) {
    let backup_data = fs.readFileSync(backup_path, 'utf8');
    let arr = backup_data !== '' ? backup_data.split(`,`) : [];
    return arr;
}

let BackupNumber = function(backup_path, target_arr) {
    fs.writeFileSync(backup_path, target_arr, 'utf8');
}

let AddBackupNumber = function(backup_path, hash) {
    let backup_data = ReadBackupNumber(backup_path);
    let target_arr = backup_data !== '' ? backup_data.split(`,`) : [];
    target_arr.push(hash);
    fs.writeFileSync(backup_path, target_arr, 'utf8');
}

let CheckIsDeposit = async function(transaction, payement_address_list) {
    try {
        if (transaction && transaction.result && transaction.result.propertyid === 31 && transaction.result.referenceaddress && CheckAddressIsExisted(payement_address_list, transaction.result.referenceaddress) ) {
            return true;
        }
        return false;
    } catch (error) {
        throw error;
    }
}

let CheckIsWithdraw = async function(transaction, payement_address_list) {
    try {
        if (transaction && transaction.result && transaction.result.valid && transaction.result.propertyid === 31 && transaction.result.sendingaddress && CheckAddressIsExisted(payement_address_list, transaction.result.sendingaddress)) {
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
        target_trans.channel_key = "usdt";
        target_trans.txid = transacton.txid;
        target_trans.address = transacton.referenceaddress;
        target_trans.value = transacton.amount;
    
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

let GetWithdrawItems = async function() {
    let scripts = "SELECT  id, txid,aasm_state,fee,sum,account_id,member_id FROM `withdraws` where aasm_state = 'almost_done' and currency = '10'";
    return await mySql.QueryDB(scripts);
} 

let  GetAllPayementAddress = async function() {
    try {
        let sql_scripts = "SELECT * FROM `payment_addresses` Where currency = 10 order by id desc";
        return await mySql.QueryDB(sql_scripts);
    } catch (error) {
        throw error;
    }
}

let MonitorTransaction = async function(withdraw_items, base_url, payement_address_list) {
    let DebugTag = logger.DebugTag("MonitorTransaction");
    let ErrorTag = logger.ErrorTag("MonitorTransaction");
    try {
        let monitor_transactions = [];
        for (let i = 0; i < withdraw_items.length; i ++) {
            if (withdraw_items[i].txid) {
                let double_check_status = await DoubleCheckTransaction(withdraw_items[i].txid, base_url, payement_address_list);
                if (double_check_status) {
                    // console.log("is successfully");
                    monitor_transactions.push(withdraw_items[i]);
                }
            }
        }
        logger.usdtinfo(DebugTag, `The followed withdaws item ${JSON.stringify(monitor_transactions)} is valid`);

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



let DoubleCheckTransaction = async function(trans_hash, base_url, payement_address_list) {
    try {
        let ret = await GetTransaction(base_url, trans_hash);
        if (ret && ret.result && ret.result.valid && ret.result.propertyid === 31 && ret.result.sendingaddress && CheckAddressIsExisted(payement_address_list, ret.result.sendingaddress)) {
            return true;
        }
        return false;
    } catch (error) {
        throw error;
    }
}

let CheckAddressIsExisted = function(payement_address_list, target_address) {
    try {
        return payement_address_list.some((item) => {
            return item && item.address && item.address.toLowerCase() == target_address.toLowerCase();
        });
    } catch (error) {
        throw error;
    }
}

SyncUSDTDaemon();
