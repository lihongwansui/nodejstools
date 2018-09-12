var Web3 = require('web3');

let web2
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let asci_hex = web3.utils.asciiToHex('I have 100!');
console.log(asci_hex);

let ret2 = web3.utils.hexToBytes(asci_hex);
console.log(ret2);

let ret3 = web3.utils.hexToAscii(asci_hex);
console.log(ret3);
