let Sequelize = require('sequelize');
let dateFormat = require('dateformat');
let schedule = require("node-schedule");
const {ExportSingleSheet} = require('../common/exportexcel');
const {InitTransport, InitOAuthTransport, SendEmail} = require('../common/email');
const mySql = require('../../nodedaemons/common/mysql/index');
const logger = require('../../nodedaemons/common/logger/logger');
const utility = require('../common/utility');
const currency_config = require('../common/currencies');
const market_config = require('../common/market');
const util = require('../../nodedaemons/common/util');
const fs = require('fs');
const Web3 = require('web3');


const moment = require('moment');

const config = require('../common/config');
const db = require('../common/sequlize');
const Op = Sequelize.Op

let GenerateDailyForms = async function(timestamp) {
    let Tag = logger.Tag("Generate Daily Forms");
    try {
        if (!timestamp) { // 通过定时器触发
            let date_now = new Date();
            date_now.setDate(date_now.getDate() - 1);
            timestamp = dateFormat(date_now,'yyyy-mm-dd');
        }
        //timestamp = '2018-05-07';
        let date_start = (new Date(`${timestamp} 00:00:00`)).getTime();
        let end_timestamp = new Date(`${timestamp} 00:00:00`);
        let date_end = end_timestamp.setDate(end_timestamp.getDate() + 1);
        console.log(`Start at ${dateFormat(date_start,'yyyy-mm-dd HH:MM:ss')}`);
        console.log(`Start end at ${dateFormat(date_end,'yyyy-mm-dd HH:MM:ss')}`);
        //console.log((date_end - date_start)/24/60/60/1000)

        let trades_result = await GetTradeStatistics(timestamp, date_start, date_end);
        logger.info(Tag + "Trades Result>>>", JSON.stringify(trades_result));
        
        let deposits_result = await GetDepositStatistics(date_start, date_end);
        logger.info(Tag + "Deposits Result>>>", JSON.stringify(deposits_result));

        let withdraws_result = await GetWithdrawStatistics(date_start, date_end);
        logger.info(Tag + "withdraws_result>>>", JSON.stringify(withdraws_result));

        let members_result = await GetMemberStatistics(date_start, date_end);
        logger.info(Tag + "members_result>>>", JSON.stringify(members_result));

        let new_trade_users_result = await GetNewTradeUserStatistics(date_start, date_end);
        logger.info(Tag + "new_trade_users_result>>>", JSON.stringify(new_trade_users_result));

        let eth_mine_result = await GetEthMineStatistics(date_start, date_end);
        logger.info(Tag + "eth_mine_result>>>", JSON.stringify(eth_mine_result));

        let platform_profits_result = await GetPlatformProfitsStatistics(timestamp, date_start, date_end);
        logger.info(Tag + "platform_profits_result>>>", JSON.stringify(platform_profits_result));

        let chubi_result = await GetChuBiStatistics();
        logger.info(Tag + "chubi_result>>>", JSON.stringify(chubi_result));

        let assemble_data = AssembleStatistics(trades_result, deposits_result, withdraws_result, members_result, new_trade_users_result, eth_mine_result, platform_profits_result, chubi_result);

        let file_name =  "DailyReport"+"-" + timestamp;
        ExportSingleSheet(file_name, assemble_data, function(excel_path) {
            SendExcel(`${file_name}.xlsx`, excel_path, timestamp);
        });
        SaveToDB(timestamp, trades_result, deposits_result, withdraws_result, members_result, new_trade_users_result,eth_mine_result, platform_profits_result, chubi_result);
    } catch (error) {
        console.log("err >>> " + error.stack); 
        logger.info(Tag, error.stack);
    }
}

let SendExcel = async function(file_name, excel_path, timestamp) {
    let transporter = InitTransport();
    let mailOptions = {
        from    : config.Mail.user_name,
        to      : config.to_email_list, 
        subject : `Daily Report For ${timestamp}`,
        text    : `Daily Report For ${timestamp}`,
        cc      : config.cc_email_list,
        attachments: [{
            filename: file_name,
            content: fs.createReadStream(excel_path)
        }]
    };
    let ret = SendEmail(transporter, mailOptions);
    if (ret.status) {
        console.log("Send Email Successfully.");
        logger.info("Send Email Successfully.")
    }
}

let SaveToDB = async function(timestamp, trades_result, deposits_result, withdraws_result, members_result, new_trade_users_result, eth_mine_result, platform_profits_result, chubi_result) {
    try {
        currency_config.forEach(async (currency) => {
            let op_statistic = {};
            let deposit_list = deposits_result.filter((deposit) => {
                return deposit.currency == currency.code;
            });
            let withdraw_list = withdraws_result.filter((withdraw) => {
                return withdraw.currency == currency.code;
            });
            let profit_list = platform_profits_result.filter((profit) => {
                return profit.currency == currency.code;
            });

            let withdraw_mine_fee_list = eth_mine_result.filter((eth_mine_item) => {
                return eth_mine_item.currency == currency.code;
            });

            let deposit_item = deposit_list.length > 0 ? deposit_list[0] : null;
            let withdraw_item = withdraw_list.length > 0 ? withdraw_list[0] : null;
            let profit_item = profit_list.length > 0 ? profit_list[0] : null;
            let withdraw_mine_fee_item = withdraw_mine_fee_list.length > 0 ? withdraw_mine_fee_list[0] : null;

            op_statistic.currency = currency.code;
            op_statistic.statistic_date = timestamp;
            op_statistic.deposit_amount = deposit_item ? deposit_item.dataValues.total_amount : 0;
            op_statistic.total_deposit = deposit_item ? deposit_item.dataValues.total_count : 0;
            op_statistic.deposit_fee = deposit_item ? deposit_item.dataValues.total_fee : 0;
            op_statistic.withdraw_amount = withdraw_item ? withdraw_item.dataValues.total_amount : 0;
            op_statistic.total_withdraw = withdraw_item ? withdraw_item.dataValues.total_count : 0;
            op_statistic.withdraw_fee = withdraw_item ? withdraw_item.dataValues.total_fee : 0;
            op_statistic.withdraw_mine_fee = withdraw_mine_fee_item ? withdraw_mine_fee_item.total_mine : 0;

            op_statistic.total_profit = profit_item ? profit_item.dataValues.total_profit : 0;
            op_statistic.day_profit = profit_item && profit_item.dataValues.day_profit ? profit_item.dataValues.day_profit : 0;
            

            let where = {
                statistic_date: timestamp,
                currency: currency.code
            };
            let result = await db.OperationStatistics.findOne({where: where});
            if (result) {
                db.OperationStatistics.update(op_statistic, {
                    where: where
                });
            } else {
                db.OperationStatistics.create(op_statistic);
            }
        });
            
        let op_user_statistic = {};
        op_user_statistic.statistic_date = timestamp;
        op_user_statistic.total_user = members_result.total_user;
        op_user_statistic.total_new_user = members_result.total_new;
        op_user_statistic.total_new_trade_user = new_trade_users_result;
        op_user_statistic.total_chu_bi = chubi_result.dataValues.total_chubi;
        
        let where = {
            statistic_date: timestamp
        }
        let result = await db.OperationUserStatistics.findOne({where: where});
        if (result) {
            db.OperationUserStatistics.update(op_user_statistic, {
                where: where
            });
        } else {
            db.OperationUserStatistics.create(op_user_statistic);
        }

        // operation trade statistic table
        for (let i = 0; i < trades_result.length; i ++) {
            let trade_item = trades_result[i];
            
            let op_trade_statistic = {};
            let where = {
                statistic_date: timestamp,
                currency: trade_item.currency
            };
            op_trade_statistic.statistic_date = timestamp;
            op_trade_statistic.currency = trade_item.currency;
            op_trade_statistic.base_unit = trade_item.quote_unit;
            op_trade_statistic.trade_amount = trade_item ? trade_item.total_funds : 0;
            op_trade_statistic.trade_account = trade_item ? trade_item.trade_account : 0;
            op_trade_statistic.trade_volume = trade_item ? trade_item.total_volume : 0;
            op_trade_statistic.trade_count = trade_item ? trade_item.total_count : 0;
            op_trade_statistic.trade_fee = trade_item ? trade_item.total_fee : 0;
            op_trade_statistic.trade_fee_profit = op_trade_statistic.trade_fee * 0.3;

            let result = await db.OperationTradeStatistics.findOne({where: where});
            if (result) {
                db.OperationTradeStatistics.update(op_trade_statistic, {
                    where: where
                });
            } else {
                db.OperationTradeStatistics.create(op_trade_statistic);
            }
        }
    } catch (error) {
        throw error;
    }
}

let AssembleStatistics =  function(trades_result, deposits_result, withdraws_result, members_result, new_trade_users_result, eth_mine_result, platform_profits_result, chubi_result) {
    try {
        let trade_statistics = [];

        market_config.forEach((market) => {
            let title = `平台交易数据统计(以${market.base_coin}为基础)`
            trade_statistics.push([title])
            trade_statistics.push(["币种", "交易量", `交易额(${market.base_coin})`, "交易笔数", "交易人数"]);
            let filtered_trades_result = trades_result.filter((trade) => {
                return trade.quote_unit == market.base_coin_code;
            });
            filtered_trades_result.forEach(function(trade) {
                trade_statistics.push([trade.name, trade.total_volume, trade.total_funds, trade.total_count, trade.trade_account]);
            })
            trade_statistics.push([]);
        });
        
        trade_statistics.push([]);
        console.log(JSON.stringify(trade_statistics));
        
        let deposit_withdraw_statistics = [];
        deposit_withdraw_statistics.push(["充提币数据统计"])
        deposit_withdraw_statistics.push(["币种", "充币", "充币人数", "提币", "提币人数"]);
        currency_config.forEach(function(currency) {
            let deposit_list = deposits_result.filter((deposit) => {
                return deposit.dataValues.currency == currency.code;
            });
            let withdraw_list = withdraws_result.filter((withdraw) => {
                return withdraw.dataValues.currency == currency.code;
            })
            let obj = {};
            let deposit_item = deposit_list.length > 0 ? deposit_list[0] : null;
            let withdraw_item = withdraw_list.length > 0 ? withdraw_list[0] : null;
            obj.name = currency.name;
            obj.deposit_amount = deposit_item ? parseFloat(deposit_item.dataValues.total_amount) : 0;
            obj.deposit_count = deposit_item ? parseFloat(deposit_item.dataValues.total_count) : 0;
            obj.withdraw_amount = withdraw_item ? parseFloat(withdraw_item.dataValues.total_amount) : 0; 
            obj.withdraw_count = withdraw_item ? parseFloat(withdraw_item.dataValues.total_count) : 0;

            deposit_withdraw_statistics.push([obj.name, obj.deposit_amount, obj.deposit_count, obj.withdraw_amount,  obj.withdraw_count]);
        })
        deposit_withdraw_statistics.push([]);
        console.log(JSON.stringify(deposit_withdraw_statistics));

        let fee_statistics = [];
        fee_statistics.push(["手续费数据统计"]);
        let fee_statistics_title = ["币种", "提币手续费", "提币矿工费(GWei)"];
        market_config.forEach((item) => {
            let statistics_title = [`交易手续费(${item.base_coin})`, `手续费盈利(${item.base_coin})`];
            fee_statistics_title = fee_statistics_title.concat(statistics_title);
        });
        
        fee_statistics.push(fee_statistics_title);
        currency_config.forEach((currency) => {
            let withdraw_list = withdraws_result.filter((withdraw) => {
                return withdraw.dataValues.currency == currency.code;
            })
            let ethminfees_list = eth_mine_result.filter((eth_mine) => {
                return eth_mine.currency == currency.code;
            });
            let withdraw_item = withdraw_list.length > 0 ? withdraw_list[0] : null;
            
            let obj = {};
            obj.name = currency.name;
            obj.withdraw_fee = withdraw_item ? withdraw_item.dataValues.total_fee : 0;
            let ethminefees_item = ethminfees_list.length > 0 ? ethminfees_list[0] : null;
            obj.mine_fee = ethminefees_item ? ethminefees_item.total_mine : 0; // ToDo

            let fees_array = [obj.name, obj.withdraw_fee, obj.mine_fee];

            market_config.forEach((market) => {
                let trade_list = trades_result.filter((trade) => {
                    return trade.currency == currency.code && trade.quote_unit == market.base_coin_code;
                })
                let trade_item = trade_list.length > 0 ? trade_list[0] : null;
                let trade_fee = trade_item ? trade_item.total_fee : 0;
                let trade_fee_profit = trade_fee * 0.3;
                let trade_fees_array = [trade_fee, trade_fee_profit];

                fees_array = fees_array.concat(trade_fees_array);
            });
            fee_statistics.push(fees_array);
        })
        
        fee_statistics.push([]);
        console.log(JSON.stringify(fee_statistics));
        let user_statistics = [];
        user_statistics.push(["用户数据统计"]);
        user_statistics.push(["新增用户", members_result.total_new]);
        user_statistics.push(["新增交易用户", new_trade_users_result]);
        user_statistics.push(["总用户数", members_result.total_user]);
        user_statistics.push([]);

        let profits_statistics = [];
        profits_statistics.push(["分币分红统计"]);
        profits_statistics.push(["币种", "当日分红", "累计分红"]);
        platform_profits_result.forEach((item) => {
            let day_profit = item.dataValues.day_profit ? item.dataValues.day_profit : 0;
            profits_statistics.push([item.dataValues.name, parseFloat(day_profit), parseFloat(item.dataValues.total_profit)]);
        });
        profits_statistics.push([]);
        profits_statistics.push(["累计发放触币", parseFloat(chubi_result.dataValues.total_chubi)]);
        console.log(JSON.stringify(profits_statistics));
        let ret = [].concat(trade_statistics).concat(deposit_withdraw_statistics).concat(fee_statistics).concat(user_statistics).concat(profits_statistics);
        console.log(JSON.stringify(ret));
        
        return ret;
    } catch (error) {
        throw error;
    }
}

let GetTradeStatistics = async function(timestamp, date_start, date_end) {
    try {
        let market_array = await GetMarketConfig();
        let market_list = util.ConvertArrayToString(market_array);

        let script = "select AV.currency, sum(volume) as total_volume, sum(funds) as total_funds , sum(AV.fee) as total_fee, count(T.id) as total_count, count(distinct AV.member_id) as trade_account, T.quote_unit as quote_unit from trades as T inner join account_versions as AV on T.id = AV.modifiable_id and AV.modifiable_type = 'Trade' and  AV.reason = '110' where T.updated_at like '%"+ timestamp +"%' and T.quote_unit in ("+market_list+") group by AV.currency, T.quote_unit order by T.quote_unit asc;";

        let result =  await mySql.QueryDB(script);
        result = result.map((item) => {
            currency_config.forEach(function(currency) {
                if (currency.code == item.currency) {
                    item.name = currency.name;
                    //item.dataValues.coin_code = market.coin_code;
                }
            })
            return item;
        });

        return result;
    } catch (error) {
        throw error;
    }
}

let GetMarketConfig = async function() {
    try {
        return market_config.map((item) => item.base_coin_code);
    } catch (error) {
        throw error;
    }
}

let GetAccountStatistics = async function(date_start, date_end) {
    try {
        return await db.Accounts.findAll({
            attributes: [
                'currency',
                [Sequelize.fn('sum', Sequelize.col('balance')), 'total_balance'],
                [Sequelize.fn('sum', Sequelize.col('locked')), 'total_locked'],
            ],
            where: {[Op.and]:{
                    //'aasm_state': config.Report_Form.deposits_accept_status,
                    'updated_at': {[Op.and]: {
                            [Op.gt]: date_start,
                            [Op.lt]: date_end
                        }
                    }
                }
            },
            group:  Sequelize.col('currency')
        });
    } catch (error) {
        throw error;
    }
}

let GetWithdrawStatistics = async function(date_start, date_end) {
    try {
        let result = await db.Withdraws.findAll({
            attributes: [
                'currency',
                [Sequelize.fn('sum', Sequelize.col('sum')), 'total_amount'],
                [Sequelize.fn('sum', Sequelize.col('fee')), 'total_fee'],
                [Sequelize.fn('count', Sequelize.literal('distinct `member_id`')), "total_count"]
            ],
            where: {[Op.and]:{
                        'aasm_state': config.Report_Form.withdrows_done,
                        'updated_at': {[Op.and]: {
                            [Op.gt]: date_start,
                            [Op.lt]: date_end
                        }
                    }
                }
            },
            group:  Sequelize.col('currency')
        });
        result = result.map(function(item) {
            currency_config.forEach(function(currency) {
                if (currency.code == item.currency) {
                    item.dataValues.name = currency.name;
                }
            })
            return item;
        })

        return result;
    } catch (error) {
        throw error;
    }
}
let GetEthMineStatistics = async function(date_start, date_end) {
    try {
        let parity_url = utility.GetParityUrl();
        if (!parity_url) {
            throw new Error("Parity url is not existed!");
        }
        console.log(`Parity url is ${parity_url}`);
        logger.info(`Parity url is ${parity_url}`);
        let web3 = new Web3(new Web3.providers.HttpProvider(parity_url));
        let ethereum_code_list = GetEthereumCode();

        let withdraws_list = await db.Withdraws.findAll({
            attributes: [
                'txid',
                'currency'
            ],
            where: {[Op.and]:{
                        'aasm_state': config.Report_Form.withdrows_done,
                        'updated_at': {[Op.and]: {
                                [Op.gt]: date_start,
                                [Op.lt]: date_end
                            },
                        },
                        'currency': {[Op.in]: ethereum_code_list} 
                    }
                }
        });
        
        let result = [];
        for(let j = 0; j < currency_config.length; j++) {
            let temp_obj = {currency: currency_config[j].code};
            let total_mine = 0;
            let temp_list = withdraws_list.filter((withdraw) => {
                return withdraw.currency == currency_config[j].code;
            });
            for(let i = 0; i < temp_list.length; i++) {
                let transaction = await web3.eth.getTransaction(temp_list[i].txid);
                if (transaction && transaction.gasPrice) {
                    total_mine = total_mine + transaction.gasPrice / (10 ** 9) * transaction.gas;
                }
            }
            temp_obj.total_mine = total_mine;
            result.push(temp_obj);
        }
        return result;
    } catch (error) {
        throw error;
    }
}

let GetDepositStatistics = async function(date_start, date_end) {
    try {
        let result = await db.Deposits.findAll({
            attributes: [
                'currency',
                [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
                [Sequelize.fn('sum', Sequelize.col('fee')), 'total_fee'],
                [Sequelize.fn('count', Sequelize.literal('distinct `member_id`')), "total_count"]
            ],
            where: {[Op.and]:{
                        'aasm_state': config.Report_Form.deposits_accept_status,
                        'updated_at': {[Op.and]: {
                                [Op.gt]: date_start,
                                [Op.lt]: date_end
                            }
                        }
                    }
            },
            group:  Sequelize.col('currency')
        });
        result = result.map(function(item) {
            currency_config.forEach(function(currency) {
                if (currency.code == item.currency) {
                    item.dataValues.name = currency.name;
                }
            })
            return item;
        })

        return result;
    } catch (error) {
        throw error;
    }
}

let GetEthereumCode = function() {
    let arr = [];
    let list = currency_config.filter((item) => {
        return item.type === 'Ethereum';
    });
    list.map(a => arr.push(a.code));
    return arr;
}

let GetMemberStatistics = async function(date_start, date_end) {
    try {
        let total_new = await db.Members.findAll({
            attributes: [
                [Sequelize.fn('count', Sequelize.literal('distinct `email`')), 'total_new_user'],
            ],
            where: {[Op.and]:{
                        'created_at': {[Op.and]: {
                                [Op.gt]: date_start,
                                [Op.lt]: date_end
                            }
                        }
                    }
            },
        });
        let total_user = await db.Members.findAll({
            attributes: [
                [Sequelize.fn('count',  Sequelize.literal('distinct `email`')), 'total_user'],
            ],
        });

        let result = {};
        if (total_new && total_new.length > 0) {
            result.total_new = total_new[0].dataValues.total_new_user;
        }
        if (total_user && total_user.length > 0) {
            result.total_user = total_user[0].dataValues.total_user;
        }
        
        return result;
    } catch (error) {
        throw error;
    }
}

let GetNewTradeUserStatistics = async function(date_start, date_end) {
    try {
        let member_list = await db.AccountVersions.findAll({
            attributes: [
                'member_id'
            ],
            where: {[Op.and]:{
                    'updated_at': {[Op.and]: {
                            [Op.gt]: date_start,
                            [Op.lt]: date_end
                        }
                    }
                }
            },
            group:  Sequelize.col('member_id')
        });

        let result = [];
        for (let index = 0; index < member_list.length; index ++) {
            let target = await db.AccountVersions.findOne({
                where: {
                    member_id: member_list[index].dataValues.member_id,
                    updated_at: {
                        [Op.lt]: date_start
                    }
                }
            })
            if (!target) {
                result.push(target);
            }
        }
        return result.length;
    } catch (error) {
        throw error;
    }
} 

let GetPlatformProfitsStatistics = async function(timestamp, date_start, date_end) {
    try {
        console.log(timestamp);
        
        let datestamp = timestamp.split(`-`).join(``);
        
        let day_profits = await db.PlatformProfitsDetails.findAll({
            attributes: [
                'currency',
                [Sequelize.fn('sum', Sequelize.col('profit')), 'day_profit'],
            ],
            // where: {[Op.and]:{
            //             'updated_at': {[Op.and]: {
            //                     [Op.gt]: date_start,
            //                     [Op.lt]: date_end
            //                 }
            //             }
            //         }
            // },
            where : {
                profit_day: datestamp
            },
            group:  Sequelize.col('currency')
        });
        let total_profits = await db.PlatformProfitsDetails.findAll({
            attributes: [
                'currency',
                [Sequelize.fn('sum', Sequelize.col('profit')), 'total_profit'],
            ],
            group:  Sequelize.col('currency')
        });
        total_profits = total_profits.map(function(item) {
            day_profits.forEach(function(day_item) {
                if (day_item.dataValues.currency === item.dataValues.currency) {
                    item.dataValues.day_profit = day_item.dataValues.day_profit;
                }
            });
            currency_config.forEach(function(currency) {
                if (currency.code == item.currency) {
                    item.dataValues.name = currency.name;
                }
            });
            return item;
        });
        return total_profits;
    } catch (error) {
        throw error;
    }
}

let GetChuBiStatistics = async function() {
    try {
        let result = await db.MemberCBAllocateDetails.findOne({
            attributes: [
                [Sequelize.fn('sum', Sequelize.col('chubi_volumn')), 'total_chubi'],
            ],
        })
        return result;
    } catch (error) {
        throw error;
    }
}

let Init = function() {
    //GenerateDailyForms();
    if(process.argv.length > 3){
        let timestamp = process.argv[3];
        GenerateDailyForms(timestamp);
    } else {
        console.log("System will send operation statistics at 4:0:0.");
        schedule.scheduleJob('0 0 4 * * *', function(){
            GenerateDailyForms();
        }); 
    }
}

Init();