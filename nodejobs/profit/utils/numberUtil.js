	var Decimal = require("decimal.js-light");
	
	Decimal.set({
	  precision: 32,
	  rounding: Decimal.ROUND_HALF_UP,
	  toExpNeg: -7,
	  toExpPos: 21
	});


	exports.round = function(data, n) {
		return 1.0 * new Decimal(data).toFixed(n);
	};
	
	exports.add = function (a, b) {
		return new Decimal(a).add(new Decimal(b)).toNumber();
	};
	
	exports.minus = function (a, b) {
		return new Decimal(a).sub(new Decimal(b)).toNumber();
	};
	
	exports.div = function (a, b) {
		return new Decimal(a).dividedBy(new Decimal(b)).toNumber();
	};
	
	exports.multi = function (a, b) {
		return new Decimal(a).times(new Decimal(b)).toNumber();
	};