var dateFormat = require('dateformat');

module.exports = function(sequelize,DataTypes){
    var MemberCBAllocateDetails = sequelize.define('member_cb_allocate_details',{
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
        origin_volumn: {
            type:DataTypes.DECIMAL,
            defaultValue: 0.0000000000000000
        },
        trade_day: {
            type:DataTypes.STRING,
            defaultValue: null
        },
        rate: {
            type:DataTypes.DECIMAL,
            defaultValue: 1.00
        },
        ext_volumn: {
            type:DataTypes.DECIMAL,
            defaultValue: 0.0000000000000000
        },
        chubi_volumn: {
            type:DataTypes.DECIMAL,
            defaultValue: 0.0000000000000000
        },
        invite_level_vol_1: {
            type:DataTypes.DECIMAL,
            defaultValue: 0.0000000000000000
        },
        invite_level_vol_2: {
            type:DataTypes.DECIMAL,
            defaultValue: 0.0000000000000000
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
    return MemberCBAllocateDetails;
};