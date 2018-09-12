const mysql = require('mysql');

module.exports = {
    QueryDB: function (sql_scripts, value){
        return new Promise(function(resolve, reject) {  
            try {
                let database_cfg = {
                    // host     : '10.35.11.134',
                    // database: 'peatio_development',
                    // user     : 'peatio',
                    // password : 'nextpwd'
                   
                    host     : 'localhost',
                    database: 'peatio_production',
                    user     : 'spursyy',
                    password : '123456',
                    connectionLimit : 10,
                };
                let pool = mysql.createPool(database_cfg);
                pool.getConnection((error, connection) => {
                    if (error) {
                        reject(error);
                    }
                    connection.query(sql_scripts, value,function (error, results, fields) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                        connection.release();
                    });
                });
            } catch (error) {
                reject(error);
            }         
        });
    },

    GetConWithTrans: function() {
        return new Promise((resolve, reject) => {
            try {
                let database_cfg = {
                    // host     : '10.35.11.134',
                    // database: 'peatio_development',
                    // user     : 'peatio',
                    // password : 'nextpwd'
                    host     : 'localhost',
                    database: 'peatio_production',
                    user     : 'spursyy',
                    password : '123456',
                    connectionLimit : 10
                };
                let pool = mysql.createPool(database_cfg);
                pool.getConnection((error, connection) => {
                    if (error) {
                        reject(error);
                    }
                    connection.beginTransaction(function(err) {                    
                        if (err) {
                            throw error;
                        }
                        resolve(connection);
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    QueryDBWithTrans: function(connection, sql_script, value) {
        return new Promise((resolve, reject) => {
            try {
                connection.query(sql_script, value, function (error, results, fields) {
                    if (error) {
                        throw error;
                    }
                    resolve(results);
                })
            } catch (error) {
                this.rollback(connection);
                reject(error);
            }
        });
    },

    RollBack: function(connection) {
        connection.rollback();
    },

    CloseConWithTrans: function(connection) {
        return new Promise((resolve, reject) => {
            try {
                connection.commit(function(err) {
                    if (err) {
                        throw err;
                    }
                    resolve({status: 1})
                });
                connection.release();
            } catch (error) {
                reject(error);
            }
        });
    }
};