module.exports = {
    funs_code: {
        unlock_funds: 1,
        lock_funds: 2,
        plus_funds: 3,
        sub_funds: 4,
        unlock_and_sub_funds: 5
    },
    reason_code: {
        strike_add: 110,
        strike_sub: 120,
        order_fullfilled: 620,
        withdraw: 1000,
        deposit: 2000
    },
    order_status: {
        wait: 100,
        done: 200
    },
    modifiable_type: {
        trade: "Trade"
    },
    amqp_queue_name:  "peatio.deposit.coin"   //"peatio.trade.new"
};
