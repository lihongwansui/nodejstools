var environment = "development";

var mysql = require("mysql");
var path = require("path");
var readYaml = require('read-yaml');

if(process.argv.length > 2){
	environment = process.argv[2];
}

var db_config_path = path.join(__dirname, '../../../config/database.yml');

//读取配置文件
var config = readYaml.sync(db_config_path);

var pool = mysql.createPool({
    host: config[environment].host,
    user: config[environment].username,
    password: config[environment].password,
    database: config[environment].database,
    connectionLimit: 10
});

var db = {};  
db.conn = function (callback) {   //callback是回调函数，连接建立后的connection作为其参数  
    pool.getConnection(function (err, connection) {  
        if (err) {      //对异常进行处理  
            throw err;  //抛出异常  
        } else {  
        	try {
        		callback(connection);   //如果正常的话，执行回调函数（即请求）  
        	} catch (e) {
        		throw e;
        	} finally {
        		 connection.release();   //释放连接  
        	}
        }  
      
    });
};

module.exports = db;