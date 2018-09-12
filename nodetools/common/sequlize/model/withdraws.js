var dateFormat = require('dateformat');

module.exports = function(sequelize,DataTypes){
    var Withdraws = sequelize.define('withdraws',{
        id:{
            //type:DataTypes.UUID,
            type:DataTypes.INTEGER,
            primaryKey:true,
            allowNull:false,
            //defaultValue:DataTypes.UUIDV1
        },
        sn:{
            type:DataTypes.STRING,
        },
        account_id:{
            type:DataTypes.INTEGER,
        },
        member_id:{
            type:DataTypes.INTEGER,
        },
        currency: {
            type:DataTypes.INTEGER,
        },
        amount:{
            type:DataTypes.DECIMAL(32, 16),
        },
        fee:{
            type:DataTypes.DECIMAL(32, 16),
        },
        fund_uid:{
            type:DataTypes.STRING,
        },
        fund_extra: {
            type:DataTypes.STRING,
        },
        created_at: {
            type:DataTypes.DATE,
        },
        updated_at: {
            type:DataTypes.DATE,
        },
        done_at: {
            type:DataTypes.DATE,
        },
        txid: {
            type:DataTypes.STRING,                        
        },
        aasm_state: {
            type:DataTypes.STRING,
        },
        sum: {
            type:DataTypes.DECIMAL(32, 16),
        },
        type: {
            type:DataTypes.STRING, 
        }
    },{
        freezeTableName: true,//freezeTableName: true  这个选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        //tableName: 'user',
        timestamps: true,
        // getterMethods   : {
        //     created_at_format : function()  {
        //         if(this.created_at){
        //             return dateFormat(this.created_at,'yyyy-mm-dd HH:MM:ss')
        //         }else{
        //             return ""
        //         }
        //      },
        //     updated_at_format : function()  {
        //         if(this.updated_dt){
        //             return dateFormat(this.updated_dt,'yyyy-mm-dd HH:MM:ss')
        //         }else{
        //             return ""
        //         }
        //     },
        // },
    });
    return Withdraws;
};