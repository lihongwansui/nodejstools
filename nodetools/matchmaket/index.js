// const mySql = require('../../nodedaemons/common/mysql/index');
const mySql = require('./mysql');
const util = require('./util');
const dateformat = require('dateformat');
const readYaml = require('read-yaml');
const path = require('path');
const amqp = require('amqplib');
let amqp_config = path.join(__dirname, './amqp.yml');
const market_config_path = path.join(__dirname, './markets.yml');
const currency_path = path.join(__dirname, './currencies.yml');
const sql_scripts = require('./sqlscripts');
const config = require('./config');

//let request_order = {"market_id":"elendeth","ask_id":8037,"bid_id":8036,"strike_price":"10","volume":"2.0","funds":"20","locale":"zh-CN"}
let Init = async function (request_order) {
    try {
        console.log("Init >>>> " + request_order.market_id);
        
        let currency_obj = GetCurrencyByMarket(request_order.market_id);
        
        let ask_order_list = await mySql.QueryDB(sql_scripts.get_order_script, [request_order.ask_id]);
        let bid_order_list = await mySql.QueryDB(sql_scripts.get_order_script, [request_order.bid_id]);
        
        if (ask_order_list.length === 0 || bid_order_list.length === 0) {
            throw new Error(`ask id or bid id may not exist order.`);
        }
        let created_at = dateformat(new Date(), "yyyy-mm-dd HH:MM:ss");

        // ToDo trend id.
        let new_trade_arr = [request_order.ask_id, ask_order_list[0].member_id, request_order.bid_id, bid_order_list[0].member_id, created_at, currency_obj.code, request_order.funds, request_order.strike_price, 1, created_at, request_order.volume];
        
        let connection = await mySql.GetConWithTrans();

        let new_trade = await mySql.QueryDBWithTrans(connection, "INSERT INTO `trades` (`ask_id`, `ask_member_id`, `bid_id`, `bid_member_id`, `created_at`, `currency`, `funds`, `price`, `trend`, `updated_at`, `volume`) VALUES ("+util.ConvertArrayToString(new_trade_arr)+")" );

        console.log(">>> > " + new_trade.insertId);
        
        let bid_member_list = await mySql.QueryDB(sql_scripts.get_member_script, [bid_order_list[0].member_id]);
        if (bid_member_list && bid_member_list.length > 0) {
            let exchange_rule = {
                buy: currency_obj.ask,
                sale: currency_obj.bid
            };
            let bid_order = {
                buy_volume: request_order.volume,
                sale_volume: request_order.funds,
                strike_price: request_order.strike_price,
                bid_price: bid_order_list[0].price
            };
            await UpdateAV(connection, new_trade, bid_member_list[0], exchange_rule, bid_order, request_order, true);
        } else {
            throw new Error('bid member list may not existed.');
        }
        
        let ask_member_list = await mySql.QueryDB(sql_scripts.get_member_script, [ask_order_list[0].member_id]);
        if (ask_member_list && ask_member_list.length > 0) {
            let exchange_rule = {
                buy: currency_obj.bid,
                sale: currency_obj.ask
            };
            let ask_order = {
                buy_volume: request_order.funds,
                sale_volume: request_order.volume
            };
            await UpdateAV(connection, new_trade, ask_member_list[0], exchange_rule, ask_order, request_order);
        } else {
            throw new Error('bid member list may not existed.');
        }
        //await UpdateOrder(request_order, currency_obj, ask_order_list[0].id, bid_order_list[0].id, new_trade, connection);
        await mySql.CloseConWithTrans(connection);
    } catch (error) {
        throw error;
    }
};

let UpdateAV = async function(connection, new_trade, bid_member, exchange_rule, order_obj, request_order, is_bid = false) {
    try {
        await UpdateSubAccountAV(connection, new_trade, bid_member, exchange_rule, order_obj, request_order, is_bid);
        await UpdateAddAccountAV(connection, new_trade, bid_member, exchange_rule, order_obj);
    } catch (error) {
        throw error;
    }
}

let GetCurrencyByMarket = function(market_id) {
    try {
        let market_list = readYaml.sync(market_config_path);
        if (market_list.length > 0) {
            let target_market_list = market_list.filter((currency) => {
                return currency.id == market_id;
            });
            if (!(target_market_list && target_market_list.length > 0 && target_market_list[0].bid &&target_market_list[0].bid.currency && target_market_list[0].ask && target_market_list[0].ask.currency)) {
                throw new Error(`Market currency config does not exist ${market_id}`);
            }

            let currencies_list = readYaml.sync(currency_path);
            if (currencies_list && currencies_list.length > 0) {
                let ask_currency_list = currencies_list.filter((currency) => {
                    return currency.code == target_market_list[0].ask.currency;
                });
                let bid_currency_list = currencies_list.filter((currency) => {
                    return currency.code == target_market_list[0].bid.currency; 
                });
                if (ask_currency_list.length == 0 || bid_currency_list.length == 0) {
                    throw new Error(`Market currency config does not exist ${market_id}`);
                }
                let market_obj = target_market_list[0];
                market_obj.bid.code = bid_currency_list[0].id;
                market_obj.ask.code = ask_currency_list[0].id;
                return market_obj;
            }
        }
        throw new Error(`Market currency config does not exist ${market_currency}`);
    } catch (error) {
        throw error;
    }
}

let UpdateSubAccountAV = async function(connection, new_trade, member_obj, exchange_rule, order_obj, request_order, is_bid) {
    try {
        let sale_account_list = await mySql.QueryDBWithTrans(connection, sql_scripts.get_account_script, [member_obj.id, exchange_rule.sale.code]);
        let created_at = dateformat(new Date(), "yyyy-mm-dd HH:MM:ss");
        if (sale_account_list && sale_account_list.length > 0) {
            await mySql.QueryDBWithTrans(connection, "update accounts set balance = balance + 0, locked = locked - ?, updated_at = ? where id = ?;", [order_obj.sale_volume, created_at, sale_account_list[0].id]);
        } else {
            throw new Error('bid account list may not existed.');
        }
        
        await mySql.QueryDBWithTrans(connection, `INSERT INTO account_versions (fun,fee,reason,amount,currency,member_id,account_id,modifiable_id,modifiable_type,locked,balance,created_at,updated_at) select ${config.funs_code.unlock_and_sub_funds}, 0, ${config.reason_code.strike_sub}, balance + locked, ${exchange_rule.sale.code}, ${member_obj.id}, ${sale_account_list[0].id}, ${new_trade.insertId}, "${config.modifiable_type.trade}", ${-order_obj.sale_volume}, 0, "${created_at}", "${created_at}"  from accounts where id = ${sale_account_list[0].id} order by created_at desc  limit 1;`);

        // update order
        let order_id;
        if (is_bid) {
            order_id = request_order.bid_id;
        } else {
            order_id = request_order.ask_id;
        }
        let order_list = await mySql.QueryDB(sql_scripts.get_order_script, [order_id]);
        if (order_list && order_list.length > 0) {
            let update_order_script = `UPDATE orders set volume = volume - ${request_order.volume}, locked = locked - ${request_order.volume}, funds_received = funds_received + ${request_order.funds}, trades_count = trades_count + 1 where id = ${order_list[0].id};`;

            if (order_list[0].volume == parseFloat(request_order.volume)) {
                let sub_locked;
                let funds_received;
                if (is_bid) {
                    sub_locked = request_order.funds;
                    funds_received = request_order.volume * (1-exchange_rule.buy.fee);
                } else {
                    sub_locked = request_order.volume;
                    funds_received = request_order.funds * (1-exchange_rule.buy.fee);
                }
                
                update_order_script =  `UPDATE orders set volume = volume - ${request_order.volume}, locked = locked - ${sub_locked}, funds_received = funds_received + ${funds_received}, trades_count = trades_count + 1, state = 200, updated_at = '${created_at}' where id = ${order_list[0].id};`;
                
                //将剩余的钱返还给买主
                if (order_list[0].locked > parseFloat(request_order.funds) && is_bid) {
                    let fullfilled_value = order_list[0].locked - request_order.funds;
                    await mySql.QueryDBWithTrans(connection, `INSERT INTO account_versions (fun,fee,reason,amount,currency,member_id,account_id,modifiable_id,modifiable_type,locked,balance,created_at,updated_at) select ${config.funs_code.unlock_funds}, 0, ${config.reason_code.order_fullfilled}, balance + locked, ${exchange_rule.sale.code}, ${order_list[0].member_id}, ${sale_account_list[0].id}, ${new_trade.insertId}, "${config.modifiable_type.trade}", ${-fullfilled_value}, ${fullfilled_value}, "${created_at}", "${created_at}"  from accounts where id = ${sale_account_list[0].id} order by created_at desc  limit 1;`);

                    // 将买主剩余的钱返给买主的主账户中，同时将locked的钱减去
                    await mySql.QueryDBWithTrans(connection, "update accounts set balance = balance + ?, locked = locked - ?, updated_at = ? where id = ?;", [fullfilled_value, fullfilled_value, created_at, sale_account_list[0].id]);

                    // 将买主的locked的钱归零
                    console.log(">>>>>" + parseFloat(sub_locked) + parseFloat(fullfilled_value));
                    
                    update_order_script =  `UPDATE orders set volume = volume - ${request_order.volume}, locked = locked - ${parseFloat(sub_locked) + parseFloat(fullfilled_value)}, funds_received = funds_received + ${funds_received}, trades_count = trades_count + 1, state = 200, updated_at = '${created_at}' where id = ${order_list[0].id};`;
                }
            }   
            await mySql.QueryDBWithTrans(connection, update_order_script);      
        }
    } catch (error) {
        throw error;
    }
};

let UpdateAddAccountAV = async function(connection, new_trade, member_obj, exchange_rule, order_obj) {
    try {
        let buy_fee = order_obj.buy_volume * exchange_rule.buy.fee;
        let add_balance = order_obj.buy_volume * (1 - exchange_rule.buy.fee);
        let created_at = dateformat(new Date(), "yyyy-mm-dd HH:MM:ss");

        let buy_account_list = await mySql.QueryDB(sql_scripts.get_account_script, [member_obj.id, exchange_rule.buy.code]);
        let buy_amount;
        if (buy_account_list && buy_account_list.length > 0) {
            await mySql.QueryDBWithTrans(connection, "update accounts set balance = balance + ?, locked = locked + 0, updated_at = ? where id = ?;", [add_balance, created_at, buy_account_list[0].id]);
        } else {
            throw new Error('bid account list may not existed.');
        }

        await mySql.QueryDBWithTrans(connection, `INSERT INTO account_versions (fun,fee,reason,amount,currency,member_id,account_id,modifiable_id,modifiable_type,locked,balance,created_at,updated_at)  select ${config.funs_code.plus_funds}, ${buy_fee}, ${config.reason_code.strike_add}, balance + locked, ${exchange_rule.buy.code}, ${member_obj.id}, ${buy_account_list[0].id}, ${new_trade.insertId}, "${config.modifiable_type.trade}", 0, ${add_balance}, "${created_at}", "${created_at}"  from accounts where id = ${buy_account_list[0].id} order by created_at desc limit 1;`);
    } catch (error) {
        mysql.RollBack(connection);
        console.log(`Mysql has been rolled back.`);
        console.log(error.stack);
        
        throw error;
    }
};

let UpdateOrder = async function(request_order, currency_obj, ask_order_id, bid_order_id, new_trade, connection) {
    try {
        //let request_order = {"market_id":"elendeth","ask_id":8037,"bid_id":8036,"strike_price":"10","volume":"2.0","funds":"20","locale":"zh-CN"}   
        let created_at = dateformat(new Date(), "yyyy-mm-dd HH:MM:ss");    
        let ask_order_list = await mySql.QueryDB(`SELECT * from orders where id = ${ask_order_id} LIMIT 1;`);
        if (ask_order_list && ask_order_list.length > 0) {
            let update_ask_order_script = `UPDATE orders set volume = volume - ${request_order.volume}, locked = locked - ${request_order.volume}, funds_received = funds_received + ${request_order.funds}, trades_count = trades_count + 1 where id = ${ask_order_id};`;

            if (ask_order_list[0].volume == parseFloat(request_order.volume)) {
                update_ask_order_script =  `UPDATE orders set volume = volume - ${request_order.volume}, locked = locked - ${request_order.volume}, funds_received = funds_received + ${request_order.funds * currency_obj.ask.fee}, trades_count = trades_count + 1, state = 200, updated_at = ${created_at} where id = ${ask_order_id};`;
            }         

            await mySql.QueryDBWithTrans(connection, update_ask_order_script);
        }

        let bid_order_list = await mySql.QueryDB(`SELECT * from orders where id = ${bid_order_id} LIMIT 1;`);
        if (bid_order_list && bid_order_list.length > 0) {
            let update_bid_order_script = `UPDATE orders set volume = volume - ${request_order.volume}, locked = locked - ${request_order.volume}, funds_received = funds_received + ${request_order.funds}, trades_count = trades_count + 1 where id = ${bid_order_id};`;

            if (bid_order_list[0].volume == parseFloat(request_order.volume)) {
                update_bid_order_script = `UPDATE orders set volume = volume - ${request_order.volume}, locked = locked - ${request_order.funds}, funds_received = funds_received + ${request_order.volume * currency_obj.bid.fee}, trades_count = trades_count + 1, state = 200, updated_at = ${created_at} where id = ${bid_order_id};`;

                if (bid_order_list[0].locked > request_order.funds) {
                    await mySql.QueryDBWithTrans(connection, `INSERT INTO account_versions (fun,fee,reason,amount,currency,member_id,account_id,modifiable_id,modifiable_type,locked,balance,created_at,updated_at) select ${config.funs_code.unlock_funds}, 0, ${config.reason_code.order_fullfilled}, balance + locked, ${bid_order_list[0].bid}, ${bid_order_list[0].member_id}, ${sale_account_list[0].id}, ${new_trade.insertId}, "${config.modifiable_type.trade}", ${-bid_order_list[0].locked + request_order.funds}, ${request_order.funds}, "${created_at}", "${created_at}"  from accounts where id = ${sale_account_list[0].id} order by created_at desc  limit 1;`);
                }
            }
            await mySql.QueryDBWithTrans(connection, update_bid_order_script);
        }
        
    } catch (error) {
        throw error;
    }
};

//GetCurrencyByMarket(6);
//Init(order_obj);

let GetAMQPOptions = function() {
    let amqp_options = readYaml.sync(amqp_config).connect;
    return amqp_options;
}

let q = config.amqp_queue_name;
amqp.connect(GetAMQPOptions()).then(function(conn){
    process.once('SIGN',function(){
      conn.close();
    });
    
    return conn.createChannel().then(function(ch){
      //设置公平调度，这里是指rabbitmq不会向一个繁忙的队列推送超过1条消息。
      ch.prefetch(1);
      //监听队列q并消费
      var ok = ch.assertQueue(q,{durable: false}).then(function(){
        ch.consume(q,((msg) => {
            console.log("Already come in ... " + msg.content.toString());
            Init(JSON.parse(msg.content));
            ch.ack(msg);
        }),{noAck:false});
      });
      return ok.then(function(){
        console.log(' [*] waiting for message')
      })
    })
}).then(null,console.error);