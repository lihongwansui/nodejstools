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
let currency_config = path.join(__dirname, '../config/currencies.yml');
let mySql = require(path.join(__dirname, './common/mysql'));
let mySqlPromise = require(path.join(__dirname, './common/mysql/wraptransaction'));
let config = require(path.join(__dirname, './common/config/config'));

let isSync = false;
let environment = 'development';

let SyncUSDTDaemon = async function() {
    let DebugTag = logger.DebugTag("SyncUSDTDaemon");
    let ErrorTag = logger.ErrorTag("SyncUSDTDaemon");

    try {
        if(process.argv.length > 2){
            environment = process.argv[2]
        }
        logger.usdtinfo(DebugTag, "Sync usdt node starting");
        console.log(DebugTag, "Sync usdt node starting");
        let usdt_config = GetUSDTConfig();
        let amqp_config = GetAMQPOptions();
        StartAMQPListen(amqp_config, usdt_config);

        await SyncUSDTNodes(usdt_config);
        setInterval(async function() {
            if (!isSync) {
                await SyncUSDTNodes(usdt_config);
            }
        }, 725000);
    } catch (error) {
        console.log(ErrorTag, error.stack);
        logger.usdtinfo(ErrorTag, error.stack);
        setTimeout(() => {
            SyncUSDTDaemon();
        }, 725000);
    }
}

let SyncUSDTNodes = async function(usdt_config) {
    let DebugTag = logger.DebugTag("SyncUSDTNodes");
    let ErrorTag = logger.ErrorTag("SyncUSDTNodes");
    try {
        isSync = true;
        let payement_address_list = await GetAllPayementAddress(usdt_config);
        // deposit
        let deposit_trans_list = [];
        let withdraw_txid_list = [];
        let txid_list = await GetMonitorTxidList(usdt_config); 
        console.log(`Pending confirm deposit length is ${txid_list.length}`);
        
        for (let i = 0; i < txid_list.length; i ++) {
            let txid = txid_list[i].txid;
            if (!txid) return;

            let transaction = await GetTransaction(usdt_config.rpc, txid);
            let isDeposit = await CheckIsDeposit(transaction, usdt_config.property_id, payement_address_list);
            if (isDeposit) {
                let target_trans = await GetTargetTransaction(transaction.result);
                deposit_trans_list.push(target_trans)
            } else {
                let isWithdraw = await CheckIsWithdraw(transaction, usdt_config.property_id, payement_address_list);
                if (isWithdraw) withdraw_txid_list.push(transaction.result.txid);
            }
        }
        let now = new Date();
        let now_at = dateformat(now, config.Date_Formate);
        if (deposit_trans_list.length > 0) {
            console.log(DebugTag, `Sending ${deposit_trans_list.length} ust deposit items.`);
            logger.usdtinfo(DebugTag, `Sending the followed ${JSON.stringify(deposit_trans_list)} to amqp.`);
            let result = await amqp.SendAMQPQueue(deposit_trans_list);
            while (!result.status) { // If amqp server is block, wait 10 seconds and send amqp again.    
                await TimeOut(10000);
                result = await amqp.SendAMQPQueue(deposit_trans_list);
            }

            let deposit_processed_txids = deposit_trans_list.map((item) => {
                return item.txid;
            })
            let deposit_item_script = `update monitor_txid_history set status = 1 , type = 'deposit' , updated_at = '${now_at}' where txid in (${util.ConvertArrayToString(deposit_processed_txids)})`;
            await mySql.QueryDB(deposit_item_script);
        }

        if (withdraw_txid_list.length > 0) {
            let deposit_item_script = `update monitor_txid_history set status = 1 , type = 'withdraw', updated_at = '${now_at}' where txid in (${util.ConvertArrayToString(withdraw_txid_list)})`;
            
            await mySql.QueryDB(deposit_item_script);
        }

        // Withdraw
        let withdraw_items = await GetWithdrawItems(usdt_config);
        console.log(DebugTag + `withdraw account length is ${withdraw_items.length}`);
        await MonitorTransaction(withdraw_items, usdt_config.rpc, usdt_config.property_id, payement_address_list);
        isSync = false;
    } catch (error) {
        throw error;
    }
}


let GetAMQPOptions = function() {
    let amqp_options = readYaml.sync(amqp_config_path).connect;
    return amqp_options;
}

let StartAMQPListen = function(amqp_config, usdt_config) {
    let DebugTag = logger.DebugTag("Listening AMQP");
    let ErrorTag = logger.ErrorTag("Listening AMQP");
    let queue = usdt_config.amqp_queue;
    try {
        amqplib.connect(amqp_config).then(function(conn){
            process.once('SIGN',function(){
                conn.close();
            });
            
            return conn.createChannel().then(function(ch){
                //设置公平调度，这里是指rabbitmq不会向一个繁忙的队列推送超过1条消息。
                ch.prefetch(1);
                //监听队列q并消费
                var ok = ch.assertQueue(queue,{durable: true}).then(function(){
                    ch.consume(queue,((msg) => {
                        try {
                            let content = msg.content.toString();
                            console.log(DebugTag, `receive new amqp message ${content}`);
                            logger.depositinfo(DebugTag, `receive new amqp message ${content}`);
                            let target = JSON.parse(msg.content);
                            
                            SaveToDepositHistoryDB(target.coin, target.txid);
                            ch.ack(msg);
                        } catch (error) {
                            console.log(ErrorTag, `JSON parse error for ${msg.content.toString()}`);
                            logger.depositinfo(ErrorTag, `JSON parse error for ${msg.content.toString()}`);   
                        }
                    }),{noAck:false});
                });
                return ok.then(function(){
                    console.log(DebugTag, 'AMQP [*] waiting for message')
                    logger.depositinfo(DebugTag, 'AMQP [*] waiting for message');
                })
            })
        }).then(null,console.error);
    } catch (error) {
        console.log(error.stack);
        throw error;
    }
}

let SaveToDepositHistoryDB = async function(coin_id, txid) {
    let DebugTag = logger.DebugTag("Save To Deposit History DB");
    let ErrorTag = logger.ErrorTag("Save To Deposit History DB");
    try {
        let select_script = `select * from monitor_txid_history where txid = '${txid}' and coin_id = '${coin_id}'`;
        let ret = await mySql.QueryDB(select_script);

        if (!(ret && ret.length > 0)) {
            let now = new Date();
            let now_at = dateformat(now, config.Date_Formate);
            let depost_history = [coin_id, txid, 0, now_at, now_at];
            let script = "INSERT INTO `monitor_txid_history` (`coin_id`, `txid`, `status`, `created_at`, `updated_at`) VALUES ("+util.ConvertArrayToString(depost_history)+")";

            mySql.QueryDB(script);
        }
    } catch (error) {
        console.log(DebugTag, error.stack);
        logger.usdtinfo(depositinfo, error.stack);
    }
}

let GetMonitorTxidList = async function(usdt_config) {
    try {
        let script = `SELECT distinct(txid) FROM monitor_txid_history where status = 0 and coin_id = '${usdt_config.code}';`;
        return await mySql.QueryDB(script);
    } catch (error) {
        logger.usdtinfo(DebugTag, error.stack);
    }
}

let GetUSDTConfig =  function() {
    let target_currencies = [];
    let currencies = readYaml.sync(currency_config);
    if (currencies && currencies.length>0) {
        target_currencies = currencies.filter(function(currency) {
            return currency.code === 'usdt';
        })
    }
    return target_currencies[0];
}

let GetTransaction = async function(rpc, trans_hash) {
    try {
        let options = {
            uri: rpc,
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

let CheckIsDeposit = async function(transaction, property_id, payement_address_list) {
    try {
        if (transaction && transaction.result && transaction.result.valid && transaction.result.propertyid == property_id && transaction.result.referenceaddress && CheckAddressIsExisted(payement_address_list, transaction.result.referenceaddress) ) {
            return true;
        }
        return false;
    } catch (error) {
        throw error;
    }
}

let CheckIsWithdraw = async function(transaction, property_id, payement_address_list) {
    try {
        if (transaction && transaction.result && transaction.result.valid && transaction.result.propertyid == property_id && transaction.result.sendingaddress) {
            // && CheckAddressIsExisted(payement_address_list, transaction.result.sendingaddress)
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
        target_trans.value = parseFloat(transacton.amount);
    
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

let GetWithdrawItems = async function(usdt_config) {
    let sql_scripts = `SELECT  id, txid,aasm_state,fee,sum,account_id,member_id FROM withdraws where aasm_state = 'almost_done' and currency = ${usdt_config.id}`;
    return await mySql.QueryDB(sql_scripts);
} 

let  GetAllPayementAddress = async function(usdt_config) {
    try {
        let sql_scripts = `SELECT * FROM payment_addresses Where currency = ${usdt_config.id} order by id desc`;
        
        return await mySql.QueryDB(sql_scripts);
    } catch (error) {
        throw error;
    }
}

let MonitorTransaction = async function(withdraw_items, rpc, property_id, payement_address_list) {
    let DebugTag = logger.DebugTag("MonitorTransaction");
    let ErrorTag = logger.ErrorTag("MonitorTransaction");
    try {
        let monitor_transactions = [];
        for (let i = 0; i < withdraw_items.length; i ++) {
            if (withdraw_items[i].txid) {
                let double_check_status = await DoubleCheckTransaction(withdraw_items[i].txid, rpc,property_id, payement_address_list);
                if (double_check_status) {
                    // console.log("is successfully");
                    monitor_transactions.push(withdraw_items[i]);
                }
            }
        }

        if (monitor_transactions.length > 0) {
            console.log(DebugTag, `There are ${monitor_transactions.length} valid withdraw items.`);
            logger.usdtinfo(DebugTag, `The followed withdaws item ${JSON.stringify(monitor_transactions)} is valid`);
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



let DoubleCheckTransaction = async function(trans_hash, rpc, property_id, payement_address_list) {
    try {
        let ret = await GetTransaction(rpc, trans_hash);
        if (ret && ret.result && ret.result.valid && ret.result.propertyid == property_id && ret.result.sendingaddress ) {
            // && CheckAddressIsExisted(payement_address_list, ret.result.sendingaddress)
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
