const mysql = require('mysql2/promise');

module.exports = {
	
	dbConfig:null,
	
	start: async function (dbCfg) {
		dbConfig = dbCfg;
		const connection = await mysql.createConnection(dbConfig);
		await connection.execute(`create table if not exists gather_history(address varchar(255) primary key, update_time DATETIME)`)
		connection.close()
	},
	
	lastCheckTime: async function (address) {
		const connection = await mysql.createConnection(dbConfig);
		const [rows, fields] = await connection.execute('SELECT * FROM `gather_history` WHERE `address` = ? limit 1 ', [address]);
		connection.close()
		if(rows.length == 0){
			return null;
		}
		else{
			//console.log(rows);
			return rows[0].update_time;
		}
	},
	
	saveCheckTime: async function (address) {
		const connection = await mysql.createConnection(dbConfig);
		const [rows, fields] = await connection.execute('SELECT * FROM `gather_history` WHERE `address` = ? limit 1 ', [address]);	
		if(rows.length == 0){
			await connection.execute('insert into `gather_history` (`address`, `update_time`) values (? ,?)', [address,new Date()]);
		}
		else {
			await connection.execute('update `gather_history` set `update_time` = ? WHERE `address` = ? ', [new Date(),address]);
		}
		connection.close()
	},
}