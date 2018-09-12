	var moment = require("moment");

	function getBeginOfDate(dateInput) {
		var now = moment(dateInput).format("YYYY-MM-DD") + " 00:00:00";
		return now;
	}
	
	function getEndOfDate(dateInput) {
		var now = moment(dateInput).format("YYYY-MM-DD") + " 23:59:59";
		return now;
	}
	
	function getOldDayOff(dateStr, day) {
		return moment(dateStr).subtract(day, "day").toDate();
	}
	
	function getOldDayOff(day) {
		return moment().subtract(day, "day").toDate();
	}
	
	exports.getBOFDateFromDayStr = function(tradeDay) {
		return getBeginOfDate(tradeDay);
	};
	
	exports.getEOFDatefromDayStr = function(tradeDay) {
		return getEndOfDate(tradeDay);
	};
	
	exports.getYesterDayStr = function(day) {
		return moment(getOldDayOff(day).getTime()).format("YYYYMMDD");
	};
	
	exports.todayTip = function() {
		return new moment().format("YYYY-MM-DD HH:mm:ss");
	};
	
	// console.log(new moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss"));

