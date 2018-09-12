var dateFormat = require('dateformat');

module.exports = function(sequelize,DataTypes){
    var Trades = sequelize.define('trades',{
        id:{
            //type:DataTypes.UUID,
            type:DataTypes.INTEGER,
            primaryKey:true,
            allowNull:false,
            //defaultValue:DataTypes.UUIDV1
        },
        price: {
            type:DataTypes.DECIMAL(32, 16),
            defaultValue: null
        },
        volume: {
            type:DataTypes.DECIMAL(32, 16),
            defaultValue: null
        },
        ask_id: {
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        bid_id: {
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        trend: {
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        currency: {
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        created_at: {
            type:DataTypes.DATE,
            defaultValue: null
        },
        updated_at: {
            type:DataTypes.DATE,
            defaultValue: null
        },
        ask_member_id: {
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        bid_member_id: {
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        funds: {
            type:DataTypes.DECIMAL(32, 16),
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
    return Trades;
};