var dateFormat = require('dateformat');

module.exports = function(sequelize,DataTypes){
    var AccountVersions = sequelize.define('account_versions',{
        id:{
            //type:DataTypes.UUID,
            type:DataTypes.INTEGER,
            primaryKey:true,
            allowNull:false,
            //defaultValue:DataTypes.UUIDV1
        },
        member_id:{
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        account_id:{
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        reason:{
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        balance:{
            type:DataTypes.DECIMAL,
            defaultValue: null
        },
        locked:{
            type:DataTypes.DECIMAL,
            defaultValue: null
        },
        fee:{
            type:DataTypes.DECIMAL,
            defaultValue: null
        },
        amount:{
            type:DataTypes.DECIMAL,
            defaultValue: null
        },
        modifiable_id:{
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        modifiable_type:{
            type:DataTypes.STRING,
            defaultValue: null
        },
        currency:{
            type:DataTypes.INTEGER,
            defaultValue: null
        },
        fun:{
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        created_at: {
            type:DataTypes.DATE,
            defaultValue: null
        },
        updated_at: {
            type:DataTypes.DATE,
            defaultValue: null
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
    return AccountVersions;
};