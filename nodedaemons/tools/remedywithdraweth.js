const Web3 = require('web3');
const mySql = require('../common/mysql');
let mySqlPromise = require('../common/mysql/wraptransaction');
const inquirer = require('inquirer');
const dateformat = require('dateformat');
const fs = require('fs');
const path = require('path');
const utility = require('../../nodetools/common/utility');
let config = require('../common/config/config');
const util = require('../common/util');
let eth_backup_path = path.join(__dirname, "../backupfolder/eth_backup_number.txt");
let web3;

let Start = async function() {
    try {
        let withdraw_items = await GetEthWthdrawsItems();
        console.log(`Pending process withdraw list is ${withdraw_items.length}`);
        
        for (let i = 0; i < withdraw_items.length; i++) {
            if (withdraw_items[i] && withdraw_items[i].txid) {
                let ret = await ConfirmProcessWithdraw(withdraw_items[i].txid);
                
                let status = await DoubleCheckTransaction(withdraw_items[i])
                if (ret.isProcess && status) {
                    await MonitorTransaction(withdraw_items[i]);
                } else {
                    console.log(`>>> >> Transaction hash ${withdraw_items[i].txid} is not processed.`);
                }
            }
        }
    } catch (error) {
        console.log(error.stack);
    }
}

let GetEthWthdrawsItems = async function() {
    try {
        let script = "select * from `withdraws` where aasm_state = 'almost_done' and currency in (3,5,6)";
        return await mySql.QueryDB(script);
    } catch (error) {
        throw error;
    }
}

let ConfirmProcessWithdraw = async function(hash) {
    try {
        return new Promise((resolve, reject) => {
            inquirer.prompt([
                {type: 'confirm', name: "isProcess", message: `Do you want to continue ethereum hash ${hash} to withdraw coins?`}
              ]).then(answer => {
                resolve(answer)
              }).catch((error) => {
                reject(error);
              });
        }); 
        
    } catch (error) {
        throw error;
    }
}

let DoubleCheckTransaction = async function(withdraw_item) {
    try {
        GetWeb3Object();  
        
        let backup_num = fs.readFileSync(eth_backup_path, 'utf8');      
        let transaction = await web3.eth.getTransaction(withdraw_item.txid);
        
        if (transaction && transaction.blockNumber && parseInt(transaction.blockNumber) < parseInt(backup_num) -5) 
            return true;
        return false;
    } catch (error) {
        throw error;
    }
}

let GetWeb3Object = async function() {
    try {
        if (typeof web3 !== 'undefined') {
            web3 = new Web3(web3.currentProvider);
        } else {
            let parity_url = utility.GetParityUrl();
            web3 = new Web3(new Web3.providers.HttpProvider(parity_url));
        }
    } catch (error) {
        throw error;
    }
}

let MonitorTransaction = async function(monitor_item) {
    try {       
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
            console.log(`>>> >>> Monitor withdraws ${monitor_item.id} successfully.`);
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

Start();