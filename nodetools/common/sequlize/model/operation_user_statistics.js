var dateFormat = require('dateformat');

module.exports = function(sequelize,DataTypes){
    var OperationUserStatistics = sequelize.define('operation_user_statistcs',{
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
        total_user: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        total_new_user: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        total_new_trade_user: {
            type: DataTypes.INTEGER,
            defaultValue: null
        },
        total_chu_bi: {
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
    return OperationUserStatistics;
};