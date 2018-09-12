const readYaml = require('read-yaml');
const mySQLSSH = require('mysql-ssh');
const mySQL = require('mysql');
const path = require('path');

const config_path = path.join(__dirname, '../../../nodetools/config.yml');
const db_config_path = path.join(__dirname, '../../../config/database.yml');

let environment = 'development'
if(process.argv.length > 2){
	environment = process.argv[2]
}

let GetDBConfig =  function() {
    let config = readYaml.sync(db_config_path);
    
    var database_cfg = Object.create(null);
    database_cfg.connectionLimit = 20;
    database_cfg.host = config[environment].host;
    database_cfg.user = config[environment].username;
    database_cfg.password = config[environment].password;
    database_cfg.database = config[environment].database;
    return database_cfg;
}

let mysql = Object.create(null);
let database_cfg = GetDBConfig();
let pool = mySQL.createPool(database_cfg);

mysql.QueryDB = function (sql_scripts){
    return new Promise(function(resolve, reject) {  
        try {
            pool.getConnection(function (err, connection) {  
                if (err) {      //对异常进行处理  
                    reject(err);  //抛出异常  
                } else {  
                    connection.query(sql_scripts, function(error, results, fields) { 
                        if(error) {
                            reject(error);
                        }
                        
                        resolve(results);
                    }); 
                    connection.release();   //释放连接
                }                
            });
        } catch (error) {
            reject(error);
        }         
    });
}

module.exports = mysql;