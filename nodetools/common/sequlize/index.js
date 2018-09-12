const Sequelize = require('sequelize');
const Utility = require('../utility');
let db_config = Utility.GetDBConfig();

let db = {
    sequelize: new Sequelize(db_config.database, db_config.user, db_config.password, {
        host: db_config.host,
        dialect: 'mysql',
        pool: {
            max: 20,  // 连接池中的最大连接数
            min: 0,   // 连接池中的最小连接数
            acquire: 1000,  // 在抛出错误之前，连接池仍会继续请求1000毫秒 
            idle: 5000   // 5000毫秒没有被链接将会被释放 
        },
        'define': {
            // 字段以下划线（_）来分割（默认是驼峰命名风格）
            'underscored': true
        },
        timezone:'+08:00',
        logging:false 
    })
}

db.Accounts = db.sequelize.import('./model/accounts.js');
db.Withdraws = db.sequelize.import('./model/withdraws.js');
db.Deposits = db.sequelize.import('./model/deposits.js');
db.Trades = db.sequelize.import('./model/trades.js');
db.Members = db.sequelize.import('./model/members.js');
db.AccountVersions = db.sequelize.import('./model/account_versions.js');
db.MemberCBAllocateDetails = db.sequelize.import('./model/member_cb_allocate_details.js');
db.PlatformProfitsDetails = db.sequelize.import('./model/platform_profits_details.js');
db.PlatformProfitsSummaries = db.sequelize.import('./model/platform_profits_summaries.js');
db.OperationStatistics = db.sequelize.import('./model/operation_statistics.js'); 
db.OperationUserStatistics = db.sequelize.import('./model/operation_user_statistics.js');
db.OperationTradeStatistics = db.sequelize.import('./model/operation_trade_statistics.js'); 

module.exports = db;








