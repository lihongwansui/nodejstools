var Decimal = require('decimal.js');

exports.round = function(data, n) {
  return 1.0 * new Decimal(data).toFixed(n);
};

exports.add = function (a, b) {
  return Decimal.add(a, b).toNumber();
};

exports.minus = function (a, b) {
  return Decimal.sub(a, b).toNumber();
};

exports.div = function (a, b) {
  return new Decimal(a).dividedBy(new Decimal(b)).toNumber();
};

exports.multi = function (a, b) {
  return new Decimal(a).times(new Decimal(b)).toNumber();
};
