	var dateUtil = require('./utils/dateUtil.js');
	var chubiAllocateService = require('./service/allocateChuBiService.js');
	var chubiProfitService = require('./service/allocateProfitService.js');
	
	var schedule = require("node-schedule");
	
	/*循环*/
	//console.log(rst[0].email);
	//console.log(rst["affectedRows"]);
	//console.log(rst.length);
	
	var jobDay = dateUtil.getYesterDayStr(1); //默认前一天任务
	var argLength = process.argv.length;
	
	if( argLength == 3) {
		
		schedule.scheduleJob('0 0 1 * * *', function(){
			jobDay = dateUtil.getYesterDayStr(1); //默认前一天任务
			chubiAllocateService.calculateMemberETH(jobDay);
		}); 
		
		schedule.scheduleJob('0 0 2 * * *', function(){
			jobDay = dateUtil.getYesterDayStr(1); //默认前一天任务
		    chubiProfitService.calculatePlatformProfit(jobDay);
		}); 
	} else if (argLength == 5) {
		jobDay = process.argv[3];
		var job = process.argv[4];
		if (job == 1) {
			chubiAllocateService.calculateMemberETH(jobDay);
		} else {
			chubiProfitService.calculatePlatformProfit(jobDay);
		}
	}
