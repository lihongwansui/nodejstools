var dateFormat = require('dateformat');

module.exports = function(sequelize,DataTypes){
    var Members = sequelize.define('members',{
        id: {
            //type:DataTypes.UUID,
            type:DataTypes.INTEGER,
            primaryKey:true,
            allowNull:false,
            //defaultValue:DataTypes.UUIDV1
        },
        sn: {
            type:DataTypes.STRING,
            defaultValue: null
        },
        display_name: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        email: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        identity_id: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: null
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: null
        },
        state: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        activated: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        country_code: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        phone_number: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        disabled: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        api_disabled: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        nickname: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        invite_code: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        invite_node: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        role: {
            type: DataTypes.INTEGER,
            defaultValue: 1
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
        },
    });
    return Members;
};