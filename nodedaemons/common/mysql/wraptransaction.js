const readYaml = require('read-yaml');
const path = require('path');
const mysql = require('mysql');

const config_path = path.join(__dirname, '../../../nodetools/config.yml');
const db_config_path = path.join(__dirname, '../../../config/database.yml');

let environment = 'development'
if(process.argv.length > 2){
	environment = process.argv[2]
}

let MySql = {
    GetDBConfig:  function() {
        let config = readYaml.sync(db_config_path);
        
        var database_cfg = Object.create(null);
        database_cfg.connectionLimit = 20;
        if (environment==='development') {
            database_cfg.host = config[environment].address;
        } else {
            database_cfg.host = config[environment].host;
        }
        database_cfg.user = config[environment].username;
        database_cfg.password = config[environment].password;
        database_cfg.database = config[environment].database;
        return database_cfg;
    }, 
    
    
    QueryDB: function(sql_script1, sql_script2) {
        let db_config = this.GetDBConfig();
        let connection = mysql.createConnection(db_config);
        return new Promise(function(resolve, reject) {
            connection.beginTransaction(function(err) {
                if (err) { reject(err); }

                connection.query(sql_script1, function (error, results, fields) {
                   
                    
                  if (error) {
                    return connection.rollback(function() {
                      reject(error);
                    });
                  }
                  connection.query(sql_script2, function (error, results, fields) {
                    if (error) {
                      return connection.rollback(function() {
                        reject(error);
                      });
                    }
                    connection.commit(function(err) {
                      if (err) {
                        return connection.rollback(function() {
                          reject(err);
                        });
                      }
                      resolve({status: 1})
                    });
                  });
                });
              });
        });
    },
    BeginTransaction: function(connection) {
        return new Promise(function(resolve, reject) {
            connection.beginTransaction(function(err) {                    
                if (err) {
                    reject(err)
                }
                resolve({status: 1});
            });
        }).catch(function(error) {
            reject(error)
        });
    },
    QueryScript: function(connection, sql_script) {
        return new Promise(function(resolve, reject) {
            try {
                connection.query(sql_script,  function (error, results, fields) {
                    if (error) {
                        resolve({status: 0});
                    }
                    resolve({status: 1});
                })
            } catch (error) {
                reject(error);
            }
            
        })
    },
    RollBack: function(connection) {
        connection.rollback();
    },
    CommitDB: function(connection) {
        return new Promise(function(resolve, reject) {
            connection.commit(function(err) {
                if (err) {
                    reject(err)
                }
                resolve({status: 1})
            });
            
            connection.end();
        })
    },
    /**
     * @params sql_scripts: array
     */
    QueryDBPromise: async function(sql_scripts = []) {
        try {
            let db_config = this.GetDBConfig();
            let connection = mysql.createConnection(db_config);
            let begain_trans_obj = await this.BeginTransaction(connection);
            if (begain_trans_obj.status === 1) {
                // sql_scripts.forEach(async function(sql_script) {
                //     let execute_obj = await this.QueryScript(connection, sql_script);
                //     if (execute_obj.status === 0) {
                //         this.RollBack(connection);
                //         throw new Error(`Script ${sql_script} executes failed.`);
                //     }
                // });
                for(let i = 0; i < sql_scripts.length; i++) {
                    let execute_obj = await this.QueryScript(connection, sql_scripts[i]);
                    
                    if (execute_obj.status === 0) {
                        this.RollBack(connection);
                        throw new Error(`Script ${sql_scripts[i]} executes failed.`);
                    }
                }
                return await this.CommitDB(connection);
            }
        } catch (error) {
            throw error;
        }
        
        

    }
    
}

module.exports = MySql;