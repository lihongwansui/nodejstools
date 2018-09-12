const ethereum = require('../common/ethereum');
const {expect} = require('chai'); 
const util = require('../common/util');
const Web3 = require('web3');
let parity_url = "http://10.35.11.56:8545";

describe("Test Ethereum", function() {
    it("Test Get Last Block Number", async function() {
        let web3 = new Web3(new Web3.providers.HttpProvider(parity_url));
        let block_num = await web3.eth.getBlockNumber();

        let last_block_num = await ethereum.GetLastEthBlockNum(parity_url);
        expect(last_block_num).to.equal(block_num);
    });
    it("Test Get Block By Block Number", async function() {
        let eth_block_num = "0x3272ab";
        let target_block_hash = "0x90d20b1049f7300236f85f674edee159b4a122963aec3be15ca209a54fc2cc12";
        let block = await ethereum.GetEthByBlockNum(parity_url, eth_block_num);
        expect(block.hash).to.equal(target_block_hash);
    });
    it("Test Get Transaction Count By Block Hash", async function() {
        let block_hash = "0x90d20b1049f7300236f85f674edee159b4a122963aec3be15ca209a54fc2cc12";
        let transaction_count = await ethereum.GetBlockTransCountByHash(parity_url, block_hash)
        expect(transaction_count).to.equal(22);
    });
    it("Test Get Transaction By Hash And Tansaction Index", async function() {
        let block_hash = "0x90d20b1049f7300236f85f674edee159b4a122963aec3be15ca209a54fc2cc12";
        let index = 2;
        let transaction = await ethereum.GetTransByBlockHashAndIndex(parity_url, block_hash, index);
        expect(transaction.value).to.equal('0x0');
    });
});