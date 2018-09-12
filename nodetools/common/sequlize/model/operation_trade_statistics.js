var dateFormat = require('dateformat');

module.exports = function(sequelize,DataTypes){
    var OperationTradeStatistics = sequelize.define('operation_trade_statistics',{
        id:{
            type:DataTypes.UUID,
            //type:DataTypes.INTEGER,
            primaryKey:true,
            allowNull:false,
            defaultValue:DataTypes.UUIDV1
        },
        statistic_date: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        currency: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        base_unit: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        trade_volume: {
            type: DataTypes.DECIMAL,
            defaultValue: null
        },
        trade_amount: {
            type: DataTypes.DECIMAL,
            defaultValue: null
        },
        trade_account: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        trade_count: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        trade_fee: {
            type: DataTypes.DECIMAL,
            defaultValue: null
        },
        trade_fee_profit: {
            type: DataTypes.DECIMAL,
            defaultValue: null
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: null
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: null
        }
    },{
        freezeTableName: true,//freezeTableName: true  这个选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        //tableName: 'user',
        timestamps: true,
        getterMethods   : {
            // created_at_format : function()  {
            //     if(this.created_at){
            //         return dateFormat(this.created_at,'yyyy-mm-dd HH:MM:ss')
            //     }else{
            //         return ""
            //     }
            //  },
            // updated_at_format : function()  {
            //     if(this.updated_dt){
            //         return dateFormat(this.updated_dt,'yyyy-mm-dd HH:MM:ss')
            //     }else{
            //         return ""
            //     }
            // },
            // total: function() {
            //     if (this.price && this.volume) {
            //         return this.price * this.volume
            //     } else {
            //         return 0;
            //     }
            // }
        },
    });
    return OperationTradeStatistics;
};