	var SQLs = require("../database/sql.js");
	var db = require('../database/pool.js');
	var Tables = require("../database/tables.js");
	var dateUtil = require('../utils/dateUtil.js');
  // var numberUtil = require('../utils/numberUtil.js');
  var numberUtil = require('../utils/decimalUtil.js');
  var in_array = require('in_array');
	
	function newMemberCBDetail(memberId, originVolumn, root, invite_node) {
		return {"member_id" : memberId, "origin_volumn":originVolumn, "his_total_volume" : 0.0,
			"rate":1.0, "ext_volumn":0.0,"chubi_volumn":0.0,
			"invite_level_vol_1" : 0.0, "invite_level_vol_2" : 0.0, "root": root, "invite_node": invite_node};
	}
	
	function newMemberCBExtDetail(memberId, extVolume, level1Vol, level2Vol) {
		return {"member_id" : memberId, "origin_volumn":0.0, "his_total_volume" : 0.0,
			"rate":1.0, "ext_volumn":extVolume,"chubi_volumn":0.0,
			"invite_level_vol_1" : level1Vol, "invite_level_vol_2" : level2Vol};
	}
	
	function newUnmatchData(memberId, level1Vol, level2Vol, root) {
		return {"memberId":memberId, "level1Vol": level1Vol, "level2Vol": level2Vol, "extVolume":0.0, "root": root};
	}
	
	function newParentMember(memberId, volume) {
		return {"memberId":memberId, "volume":volume};
	}
	
	function newHistMember(memberId, hisTotalVolume) {
		return {"member_id" : memberId, "his_total_volume":hisTotalVolume};
	}
	
	function newProfitQuotes(minVal, maxVal, value) {
		return {"minVal" : minVal, "maxVal":maxVal,
			"value":value};
	}
	
	function newMemberChildCBDetail(originVol, invitedCode, memberId) {
		return {"originVol" : originVol, "invitedCode":invitedCode,
			"memberId":memberId};
	}

	//计算每个用户某天的ETH贡献值
	// function calcMemberContribute(tradeDay) {
	exports.calculateMemberETH = function(tradeDay) {
		db.conn(function(connection) {
			//查看是否已经派发完毕，派发数量必须大于0
			connection.query(SQLs.QUERY_CONFIG_VALUE, ["ALLOCATE_VOL"], function(err1, rst) {
				var allocatedTotalNum = rst[0].value;
				if (allocatedTotalNum > 1) {
					cleanAndCalMemberETH(tradeDay);
				} else {
					console.log("币已全部派发完成。。。");
				}
			});
		});
	};
	
	
	function cleanAndCalMemberETH(tradeDay) {	
		
		console.log("开始处理 " + tradeDay + " ETH分配值，开始时间：" + new Date());
		db.conn(function(connection) {
			connection.beginTransaction(function(err) {
				
				connection.query(SQLs.CLEAN_CHUBI_ALLOCATE, [tradeDay], function(err1, rst) {
				//清理当天已经执行过的。这样可以重复执行任务
				if (err1) {
					console.log("清理ETH贡献值错误", err1);
					connection.rollback();
					return;
					} else {
						console.log("清理ETH贡献值---------OK");
					}
				});
				
				var beginOfDay = dateUtil.getBOFDateFromDayStr(tradeDay);
				var endOfDay = dateUtil.getEOFDatefromDayStr(tradeDay);
	
        //插入用户当天交易贡献的ETH记录
				connection.query(SQLs.MEMBER_TODAY_ETH_CAL, [tradeDay,beginOfDay,endOfDay,beginOfDay,endOfDay], function(err1, rst) {
	 				if (err1) {
	 					console.log("插入用户当天交易贡献的ETH记录错误----------FAIL", err1);
	 					connection.rollback();
	 					return;
	 				} else {
	 					console.log("插入用户当天交易贡献的ETH记录 ------------OK");
	 				}
				});
				
				//#记录平台账号贡献值
				connection.query(SQLs.PLATFORM_ETH_CAL, [tradeDay], function(err1, rst) {
	 				if (err1) {
	 					console.log("记录平台账号贡献值----------FAIL", err1);
	 					connection.rollback();
	 					return;
	 				} else {
	 					console.log("记录平台账号贡献值-----------OK");
	 				}
				});
				connection.commit();
				//获取用户当天贡献的ETH值
				getMemberAllocatedByDay(tradeDay);
			});
		});
	}
	
	//获取需要派发触币的用户信息
	function getMemberAllocatedByDay(tradeDay) {
		db.conn(function(connection) {
			//#获取平台账户ID
			connection.query(SQLs.QUERY_CONFIG_VALUE, ["CHUBI_MEMBER_ID"], function(err1, rst) {
        var platFormMemberId = rst[0].value;
				
        var singleData = null;
				connection.query(SQLs.QUERY_MEMBER_TOTAL_ETH, [tradeDay, platFormMemberId], function(err1, rst) {
          var members = [];
					for (var i = 0; i < rst.length; i++) {
						singleData = rst[i];
						// singleData["root"] = singleData["root"] == null ? 0 : singleData["root"];
						singleData["invite_node"] = singleData["invite_node"] == null ? 0 : singleData["invite_node"];
						members.push(newMemberCBDetail(singleData["member_id"],singleData["totalETH"], singleData["root"], singleData["invite_node"]));
          }
					//设置用户一二级分级获取量
					fullFillExt(members, tradeDay, platFormMemberId);
				});
			});
		});
	}
	//设置当天交易的用户的历史交易额
	function fullFillHisVolume(members, tradeDay, platFormMemberId) {
		db.conn(function(connection) {
			var singleData = null;
			connection.query(SQLs.QUERY_MEMBER_HIS_ETH, [tradeDay, platFormMemberId], function(err1, rst) {
				for (var i = 0; i < rst.length; i++) {
					singleData = rst[i];
					members.forEach(function(item, idx) {
						if (item["member_id"] == singleData["member_id"]) {
							item["his_total_volume"] = singleData["totalETH"];
						}
					});
				}
				//设置用户加权值Rate
				fullFillRate(members, tradeDay);
			});
		});
  }
  function findRootInMember(members, tradeDay) {
    var tmp = [];
    members.forEach((item, idx) => {
      var flag = false;
      members.forEach((i, id) => {
        if (item.root == i.member_id) {
          flag = true;
        }
      })
      if (flag == false && item.root != undefined) {
        var newMember = newMemberCBDetail(item.root, 0, 0, 0);
        db.conn(function(connection) {
          connection.query(SQLs.INSERT_UNMATCHED_ALLOCATE_DETAIL,[newMember["member_id"], tradeDay, newMember["ext_volumn"],
          newMember["invite_level_vol_1"],newMember["invite_level_vol_2"]],function(err) {
            if(!err) {
              console.log("记录当天没有交易记录的Root-------");
            }
          });
        });
        members.push(newMember);
      }
    })

    return members;
  }
  
  // 设置用户 root volumn
  function fillRootVolumn(members, rate, tradeDay) {
    var tmp = findRootInMember(members, tradeDay);
    members.forEach((item, idx) => {
      var sum = 0;
      members.forEach((i, id) => {
        if (i.member_id == item.member_id) {
          return;
        }
        if (item.member_id == i.root) {
          var invite_arr = i.invite_node.split(",");
          if (!in_array(item.member_id, invite_arr)) {
            sum = numberUtil.add(sum, i.origin_volumn);
          }
        }
      })
      item["root_volumn"] = numberUtil.round(numberUtil.multi(sum, rate), 16);
      item["ext_volumn"] = numberUtil.add(item["ext_volumn"], numberUtil.round(numberUtil.multi(sum, rate), 16));
    })
  }
	
	//设置用户加权值Rate
	function fullFillRate(members, tradeDay) {
		var DATA_BASE_UPP_LIMT = 2000000000;
		
		db.conn(function(connection) {
			//获取加权阈值的配置信息
			connection.query(SQLs.QUERY_PROFIT_QUOTES, [], function(err1, rst) {
				var profitConfigs = [];
				var singleData = null;
				for (var i = 0; i < rst.length; i++) {
					singleData = rst[i];
					profitConfigs.push(newProfitQuotes(singleData["volumn_min"], singleData["volumn_max"], singleData["value"]));
				}
				var tmpVolume = 0.0;
				for(var i = 0; i < members.length; i++) {
					tmpVolume = members[i]["origin_volumn"] + members[i]["ext_volumn"] + members[i].his_total_volume;
					if (tmpVolume >= DATA_BASE_UPP_LIMT) { // 数据库配置的最大范围是2000000000。如果超过了，直接按照最大-1处理
						tmpVolume = DATA_BASE_UPP_LIMT - 1;
					}
					for(var j = 0; j < profitConfigs.length; j++) {
						if (tmpVolume > profitConfigs[j].minVal && tmpVolume <= profitConfigs[j].maxVal) {
							members[i]["rate"] = profitConfigs[j]["value"];
							break;
						}
					}
				}
								
				fullFillChuBiVolumn(members, tradeDay);
			});
		});
	}
	
	//设置额外加权值和分享1级，2级交易量
	function fullFillExt(members, tradeDay, platFormMemberId) {
		//查看1级分享者交易情况
		db.conn(function(connection) {
			//获取加权阈值的配置信息
			connection.query(SQLs.QUERY_SUB_CHILDREN_ETH, [tradeDay], function(err1, rst) {
	
				connection.query(SQLs.QUERY_LEVEL_CONFIG_VALUE, [], function(err2, rst2) {
				
					var level1Rate = 0.0, level2Rate = 0.0;
					if (rst2.length != 2) {
						console.warn("分配1,2级系数的配置希望是2，得到（" + rst2.length + ")");
					}
					
					for (var i = 0; i < rst2.length; i++) {
						if (rst2[i]["name"] == "INTRODUCE_LEVEL_1") {
							level1Rate = rst2[i]["value"]; 
						} else {
							level2Rate = rst2[i]["value"]; 
						}
					}
					
					var singleData = null;
			
					var childrenMembers = [];
					
					for (var i = 0; i < rst.length; i++) {
						singleData = rst[i];
						childrenMembers.push(newMemberChildCBDetail(singleData["origin_volumn"],singleData["invite_node"],singleData["member_id"]));
					}
					var tmpInvitedCode = null, tmpMemberId = null;
					
					var parentMembers = [], grandParentMembers = [];
					var parentsIds = null;
					//计算每个有邀请关系记录的1级，2级值
					for (var j = 0; j < childrenMembers.length; j++) {
						parentsIds = childrenMembers[j]["invitedCode"].split(","); //parentsIds[0]代表1级邀请。 parentsIds[1]代表2级邀请
						if (parentsIds.length > 1) { //两级邀请
							setVolumn(grandParentMembers,parentsIds[1],childrenMembers[j]["originVol"]);
							setVolumn(parentMembers,parentsIds[0],childrenMembers[j]["originVol"]);
						} else {
							setVolumn(grandParentMembers,parentsIds[0],childrenMembers[j]["originVol"]);
						}
          }

					var unMatchedData = [];
					//1级关系的值更新到members比较，
					var matchIdx = -1;
					for (var j = 0; j < grandParentMembers.length; j++) {
						matchIdx = -1;
						for (var i = 0; i < members.length; i++) {
							if (grandParentMembers[j]["memberId"] == members[i]["member_id"]) {
								members[i]["invite_level_vol_1"] = numberUtil.add(members[i]["invite_level_vol_1"], grandParentMembers[j]["volume"]);
								matchIdx = i;
								break;
							}
						}
						if (matchIdx > -1) {
							members[matchIdx]["ext_volumn"] = numberUtil.add(members[matchIdx]["ext_volumn"], numberUtil.multi(members[matchIdx]["invite_level_vol_1"], level1Rate));
						} else {
							setUnMatchedVolume(unMatchedData, grandParentMembers[j]["memberId"], grandParentMembers[j]["volume"], 1);
						}
					}
					
					//2及关系更新
					for (var j = 0; j < parentMembers.length; j++) {
						matchIdx = -1;
						for (var i = 0; i < members.length; i++) {
							if (parentMembers[j]["memberId"] == members[i]["member_id"]) {
								members[i]["invite_level_vol_2"] = numberUtil.add(members[i]["invite_level_vol_2"], parentMembers[j]["volume"]);
								matchIdx = i;
								break;
							}
						}
						if (matchIdx > -1) {
							members[matchIdx]["ext_volumn"] = numberUtil.add(members[matchIdx]["ext_volumn"], numberUtil.multi(members[matchIdx]["invite_level_vol_2"], level2Rate));
						} else {
							setUnMatchedVolume(unMatchedData, parentMembers[j]["memberId"], parentMembers[j]["volume"], 2);
						}
          }
          

					//计算unMatchedVolumn的 ExtVolume
					for (var j = 0; j < unMatchedData.length; j++) {
						unMatchedData[j]["extVolume"] = numberUtil.add(numberUtil.multi(unMatchedData[j]["level1Vol"], level1Rate), numberUtil.multi(unMatchedData[j]["level2Vol"], level2Rate));
						//记录到数据库
						members.push(newMemberCBExtDetail(unMatchedData[j]["memberId"],
							unMatchedData[j]["extVolume"], 
							unMatchedData[j]["level1Vol"], unMatchedData[j]["level2Vol"])); //统一归到members里面。计算chubi分配
          }
          
					unMatchedData.forEach(function(item, idx) {
						db.conn(function(connection) {
							connection.query(SQLs.INSERT_UNMATCHED_ALLOCATE_DETAIL,[item["memberId"], tradeDay, item["extVolume"],
								item["level1Vol"],item["level2Vol"]],function(err) {
								if(err) {
									console.log("记录当天没有交易记录-------FAIL" + err);
								}
							});
						});
					});
					//设置chubiVolume
          // fullFillChuBiVolumn(members, tradeDay);
          db.conn(function(connection) {
            connection.query(SQLs.QUERY_ROOT_RATE_CONFIG_VALUE, [], function(err, rst) {
              fillRootVolumn(members, rst[0].value, tradeDay);
			  fullFillHisVolume(members, tradeDay, platFormMemberId);
            });
          });
				});
			});
		});
	}
	
	//设置chubiVolume
	function fullFillChuBiVolumn(members, tradeDay) {
		db.conn(function(connection) {
			//获取加权阈值的配置信息
			connection.query(SQLs.QUERY_CB_CONFIG_VALUE, [], function(err1, rst) {
				var todayChuBiAllocateTotal = 0.0, todayAllocateRate = 0.0;
				
				if (rst.length != 2) {
					console.warn("触币的分配参数长度不为2，实际为 " + rst.length);
				}
	
				for (var i = 0; i < rst.length; i++) {
					if (rst[i]["name"] == "ALLOCATE_VOL") {
						todayChuBiAllocateTotal = rst[i]["value"];
					} else if (rst[i]["name"] == "PROFIT_RATE") {
						todayAllocateRate = rst[i]["value"];
					}
				}
				
				if (todayChuBiAllocateTotal < 1) {
					return;
				}
				
				console.log("触币当天分配额度 === " + todayChuBiAllocateTotal);
				console.log("触币当日分配给用户比例 === " + todayAllocateRate);
				var memberAllocateTotal = todayChuBiAllocateTotal * todayAllocateRate / 100.0;
				
				var ethVolumnTotal = 0.0, tmpCalc = 0.0;
				for (var i = 0; i < members.length; i++) {
					// console.log(members[i]["origin_volumn"] + "M===" + (members[i]["origin_volumn"] * members[i]["rate"] + members[i]["ext_volumn"]));
					ethVolumnTotal += (members[i]["origin_volumn"] + members[i]["ext_volumn"]) * members[i]["rate"];
					
					// console.log("ethVolumnTotal===" + ethVolumnTotal);
				}
				ethVolumnTotal = numberUtil.round(ethVolumnTotal, 16);
				console.log("当日ETH加权总和 = " + ethVolumnTotal + ", 当日用户能获得总额触币量 = " + memberAllocateTotal);
				var singleMemberVolumn = 0.0;
				for (var i = 0; i < members.length; i++) {
					if (i == members.length - 1) { //最后一个了。直接用剩下的值
						members[i]["chubi_volumn"] = memberAllocateTotal - tmpCalc;
						break;
					}
					singleMemberVolumn = (members[i]["origin_volumn"] + members[i]["ext_volumn"]) *  members[i]["rate"];
					
					members[i]["chubi_volumn"] = numberUtil.round((numberUtil.multi(memberAllocateTotal, singleMemberVolumn))/ethVolumnTotal,16);
					tmpCalc = tmpCalc + members[i]["chubi_volumn"]; 
				}
				allocateChuBi(members, tradeDay);
			});
		});
	}
	
	//更新触币获得量
	function allocateChuBi(members, tradeDay) {
		var success = true;
    var errObj = null;
		members.forEach(function (item,index) {
			db.conn(function(connection) {
				connection.query(SQLs.UPDATE_CHUBI_VOLUMN, [item["rate"], item["ext_volumn"],
					item["invite_level_vol_1"], item["invite_level_vol_2"], item["chubi_volumn"], item['root_volumn'],
					item["member_id"], tradeDay], function(err, rst) {
					if (err) {
						success = false;
						errObj = err;
					}
				});
			});
	  	});
	  	
	  	if (!success) {
	  		console.log("更新触币获得量--------FAIL", errObj);
	  	} else {
	  		console.log("更新触币获得量---------OK, 截止时间=" + new Date());
	  		
	  	}
	}
	
	function setVolumn(parentMembers, memberId, volume) {
		var hasParent = false;
		for (var j = 0; j < parentMembers.length; j++) {
			if (parentMembers[j]["memberId"] == memberId) {
				parentMembers[j]["volume"] = numberUtil.add(parentMembers[j]["volume"], volume);
				hasParent = true;
			}
		}
		
		if (hasParent == false) {
			parentMembers.push(newParentMember(memberId,volume));
		}
	}
	
	function setUnMatchedVolume(unMatchedMembers, memberId, volume, level) {
		var needMerge = false;
		for (var j = 0; j < unMatchedMembers.length; j++) {
			if (unMatchedMembers[j]["memberId"] == memberId) {
				if (level == 1) {
					unMatchedMembers[j]["level1Vol"] = numberUtil.add(unMatchedMembers[j]["level1Vol"], volume);
				} else  {
					unMatchedMembers[j]["level2Vol"] = numberUtil.add(unMatchedMembers[j]["level2Vol"], volume);
				} 
				needMerge = true;
				break;
			}
		}
		if (needMerge == false) { //没有找到，则新增一条
			if (level == 1) {
				unMatchedMembers.push(newUnmatchData(memberId, volume, 0.0));
			} else {
				unMatchedMembers.push(newUnmatchData(memberId, 0.0, volume));
			} 
		}
	}
