const format = require('string-format');
format.extend(String.prototype, {});

let str = '{0}, you have {1} unread message{2}'.format('Holly', 2, 's');

console.log(str);
