const {expect} = require('chai');
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://10.35.11.56:8545"));

describe("Test Web3 Package", function() {
   it("Get Block Number", async function() {
        let blockNumber = 3304914;
        let block = await web3.eth.getBlock(blockNumber);
        let transaction_count = await web3.eth.getBlockTransactionCount(block.hash);
        expect(transaction_count).to.equal(24);
   });
});