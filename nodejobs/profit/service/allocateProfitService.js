	var SQLs = require("../database/sql.js");
	var db = require("../database/pool.js");
	var Tables = require("../database/tables.js");
	var dateUtil = require('../utils/dateUtil.js');
	var numberUtil = require('../utils/numberUtil.js');


	function newMemberProfitData(memberId, chubiVolumn) {
		return {"memberId": memberId, "chubiVolumn" : chubiVolumn};
	}
	
	function newSummaryProfitData(currency, fee) {
		return {"currency": currency, "fee" : fee, "allocatedProfit" : 0.0};
	}
	
	function newCurrencyMemberProfit(memberId, currency, profit) {
		return {"memberId": memberId, "currency" : currency, "profit" : profit};
	}
	
	//计算当日平台手续费收益
	exports.calculatePlatformProfit = function (tradeDay) {
		console.log("开始计算计算当日 (" + tradeDay + ")平台手续费收益 -- " + dateUtil.todayTip());
		db.conn(function(connection) {
			connection.beginTransaction(function(err) {
				//清理概要(summary)数据
				connection.query(SQLs.CLEAN_PROFIT_SUMMARY, [tradeDay], function(err) {
					if (err) {
						console.warn("清理每日平台手续费收益(summary)记录-----FAIL", err);
						return;
					}
				});
				
				//清理每个用户详细分红数据
				connection.query(SQLs.CLEAN_PROFIT_DETAIL, [tradeDay], function(err) {
					if (err) {
						console.warn("清理每日平台手续费收益(detail)记录-----FAIL", err);
						return;
					}
				});
				
				var beginOfDay = dateUtil.getBOFDateFromDayStr(tradeDay);
				var endOfDay = dateUtil.getEOFDatefromDayStr(tradeDay);
				
				//统计每日手续费概要数据
				connection.query(SQLs.INSERT_PROFIT_SUMMARY, [tradeDay, beginOfDay, endOfDay], function(err) {
					if (err) {
						console.warn("统计每日手续费概要数据-----FAIL", err);
						return;
					} 
				});
				
				var summaryProfits = [];
				connection.query(SQLs.QUERY_PROFITS_SUMMARY, [tradeDay], function(err, rst) {
					if (err) {
						console.warn("查询每日手续费概要-----FAIL", err);
						return;
					}
					
					rst.forEach(function(item, idx) {
						summaryProfits.push(newSummaryProfitData(item["currency"], item["fee"]));
					});
					
					//console.log("查询每日手续费概要(length=)" + summaryProfits.length + " ----OK");
				});
				
				//每个用户的详细信息统计
				connection.query(SQLs.QUERY_MEMBER_TOTAL_CB,[tradeDay], function(err, rst) {
					if (err) {
						console.warn("每个用户的详细信息统计-----FAIL", err);
						return;
					}
					
					var singleData = null;
					var members = [];
					var totalChubiAmt = 0;
					rst.forEach(function(item, idx) {
						totalChubiAmt += item["totalChubi"];
						members.push(newMemberProfitData(item["member_id"], item["totalChubi"]));
					});
					
					var tempProfit = 0.0;  //临时存放收益字段
					var currencyProfitMembers = []; //每个用户每种货币得到的收益

					if (members.length > 0 && summaryProfits.length > 0 && totalChubiAmt > 0) {
						for (var i = 0; i < members.length; i++) {
							if (i == (members.length - 1)) { //最后一个人，直接剩余值
								summaryProfits.forEach(function(item, idx) {
									currencyProfitMembers.push(
										newCurrencyMemberProfit(members[i]["memberId"], item["currency"], 
											numberUtil.minus(item["fee"],item["allocatedProfit"]))
									);
									// console.log("memerId=" + members[i]["memberId"]);
									// console.log("currency=" + item["currency"]);
									// console.log("fee=" + item["fee"]);
									// console.log("allocatedProfit=" + item["allocatedProfit"]);
									// console.log("left=" + numberUtil.minus(item["fee"],item["allocatedProfit"]));
									// console.log("############################");
								});
							} else {
								summaryProfits.forEach(function(item, idx) {
									tempProfit = numberUtil.round(item["fee"] * members[i]["chubiVolumn"] / totalChubiAmt, 16);
									currencyProfitMembers.push(newCurrencyMemberProfit(members[i]["memberId"], item["currency"], tempProfit));
									item["allocatedProfit"] = numberUtil.round(tempProfit + item["allocatedProfit"], 16);
								});
							}
						}
					}
					
					// console.log(currencyProfitMembers);
					//分红详情记录到数据库
					currencyProfitMembers.forEach(function(item, idx) {
						connection.query(SQLs.INSERT_PROFIT_DETAIL, [item["memberId"], item["profit"], item["currency"], tradeDay],function(err) {
							
						});
					});
					
					//更新用户accountId
					connection.query(SQLs.UPDATE_PROFIT_DETAIL_ACCOUNT_ID, [tradeDay],function(err) {
						if (err) {
							console.warn("更新用户AccountID------FAIL", err);
						}
					});
					
					console.log("分红结束---" + dateUtil.todayTip());
				});
				
				connection.commit();
			});
		});
	};
