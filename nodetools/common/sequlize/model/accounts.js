var dateFormat = require('dateformat');

module.exports = function(sequelize,DataTypes){
    var Accounts = sequelize.define('accounts',{
        id:{
            //type:DataTypes.UUID,
            type:DataTypes.INTEGER,
            primaryKey:true,
            allowNull:false,
            //defaultValue:DataTypes.UUIDV1
        },
        member_id:{
            type:DataTypes.INTEGER,
        },
        currency:{
            type:DataTypes.INTEGER,
        },
        balance:{
            type:DataTypes.DECIMAL(32, 16),
        },
        locked:{
            type:DataTypes.DECIMAL(32, 16),
        },
        in:{
            type:DataTypes.DECIMAL(32, 16),
        },
        out:{
            type:DataTypes.DECIMAL(32, 16),
        },
        default_withdraw_fund_source_id: {
            type:DataTypes.INTEGER,
        },
        created_at: {
            type:DataTypes.DATE,
        },
        updated_at: {
            type:DataTypes.DATE,
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
    return Accounts;
};