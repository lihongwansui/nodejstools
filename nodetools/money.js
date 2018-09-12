const mysqlssh = require('mysql-ssh');
const fs = require('fs');

function Record () {
	this.name = ""
	this.btc = 0.0;
	this.eth = 0.0;
	this.mitao = 0.0;
	this.add = function (currency,value){
		if (currency == 2){
			this.btc += value
		}
		else if (currency == 3){
			this.eth += value
		}
		else if (currency == 4){
			this.mitao += value
		}
	}

	this.display = function (){
		console.log(this.name + " BTC:" + this.btc + " ETH:" + this.eth + " Mitao:" + this.mitao)
	}
}

 
mysqlssh.connect(
    {
        host: '10.35.21.34',
        user: 'user',
        password: '123456'
    },
    {
        host: 'localhost',
        user: 'root',
        password: 'nextpwd',
        database: 'peatio_development'
    }
)
.then(client => {
	//用户充值，用户余额，用户提现，交易手续费，提现手续费
	var deposit = new Record()
	deposit.name = "用户充值"
	client.query('SELECT * FROM `deposits`', function (err, results, fields) {
        if (err) throw err
        for(i = 0 ; i < results.length ; i++){
        	dp = results[i]
        	deposit.add(dp.currency,parseFloat(dp.amount))
        }
        deposit.display()
    })

    var remain = new Record()
	remain.name = "用户余额"
	client.query('SELECT * FROM `accounts`', function (err, results, fields) {
        if (err) throw err
        for(i = 0 ; i < results.length ; i++){
        	dp = results[i]
        	remain.add(dp.currency,parseFloat(dp.balance) + parseFloat(dp.locked))
        }
        remain.display()
    })


    var withdraw = new Record()
	withdraw.name = "用户提现"
	var drawFee = new Record()
	drawFee.name = "提现手续费"
	client.query('SELECT * FROM `withdraws`', function (err, results, fields) {
        if (err) throw err
        	//console.log(results)
        
    	for(i = 0 ; i < results.length ; i++){
    		dp = results[i]
    		if(dp.aasm_state == 'done'){
    			withdraw.add(dp.currency,parseFloat(dp.amount))
    			drawFee.add(dp.currency,parseFloat(dp.fee))
    		}
    	}
       
        withdraw.display()
        drawFee.display()
    })

	//5 btc/eth 2-3  6 btc/mitao 2-4 7 eth/mitao 3-4
    var trade = new Record()
	trade.name = "交易额"
	var tradeFee = new Record()
	tradeFee.name = "交易费"
	client.query('SELECT * FROM `trades`', function (err, results, fields) {
        if (err) throw err
        for(i = 0 ; i < results.length ; i++){
        	dp = results[i]
        	if (dp.currency == 5){
        		trade.add(2,parseFloat(dp.volume))
        		trade.add(3,parseFloat(dp.funds))
        	}
        	else if (dp.currency == 6){
				trade.add(2,parseFloat(dp.volume))
        		trade.add(4,parseFloat(dp.funds))
        	}
        	else if (dp.currency == 7){
        		trade.add(3,parseFloat(dp.volume))
        		trade.add(4,parseFloat(dp.funds))
        	}
        }
        tradeFee.btc = trade.btc * 0.002
        tradeFee.eth = trade.eth * 0.002
        tradeFee.mitao = trade.mitao * 0.002
        trade.display()
        tradeFee.display()
    })

    client.query('SELECT * FROM `accounts`', function (err, results, fields) {
        if (err) throw err
        //console.log(results);
        mysqlssh.close()
    })
    
})
.catch(err => {
    console.log(err)
})