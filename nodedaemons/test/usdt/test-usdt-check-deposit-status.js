const readYaml = require('read-yaml');
const path = require('path');
const amqp = require('./common/amqp'); 
const dateformat = require('dateformat');
const util = require('./common/util');
const rp = require('request-promise');
const request = require('request');
const amqplib = require('amqplib');

let amqp_config_path = path.join(__dirname, '../config/amqp.yml');
let currency_path = path.join(__dirname, '../config/currencies.yml');
let currency_config = path.join(__dirname, '../config/currencies.yml');
let mySql = require(path.join(__dirname, '../common/mysql'));
let mySqlPromise = require(path.join(__dirname, '../common/mysql/wraptransaction'));
let config = require(path.join(__dirname, '../common/config/config'));

let Start = async function() {
    try {
        
    } catch (error) {
        console.log(error.stack);
    }
}

Start();