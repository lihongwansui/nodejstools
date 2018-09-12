const readYaml = require('read-yaml');
const baseConvert = require('baseconvert');
const path = require('path');

const database_path = path.join(__dirname, '../../config/database.yml');
const config_path = path.join(__dirname, "../config.yml");

let environment = 'development';
if(process.argv.length > 2){
	environment = process.argv[2]
}

let Utility = {
    GetDBConfig: function() {
        let config = readYaml.sync(database_path);
        
        var database_cfg = Object.create(null);
        database_cfg.connectionLimit = 20;
        
        if (environment==='development') {
            database_cfg.host = config[environment].address;
        } else {
            database_cfg.host = config[environment].host;
        }
        database_cfg.port = config[environment].port || 3306;
        database_cfg.user = config[environment].username;
        database_cfg.password = config[environment].password;
        database_cfg.database = config[environment].database;
        return database_cfg;
    },
    GetParityUrl: function() {
        let parity_config = readYaml.sync(config_path);
        if (parity_config[environment] && parity_config[environment].parity_url) { 
            return parity_config[environment].parity_url;
        }  else {
            return;
        }
    },
    ConvertFrom16To10: function (number) {
        let target = baseConvert.converter(number).fromBase(16).toBase(10);
        return parseInt(target);
    },
}

module.exports = Utility;

