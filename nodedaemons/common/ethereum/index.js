const rp = require('request-promise');
const util = require('../util');



module.exports = {
    OptionType: {
        GetLastEthBlockNum: 0,
        GetEthByBlockNum: 1,
        GetBlockTransCountByHash: 2, 
        GetTransByBlockHashAndIndex: 3
    },

    GetOptions: function(option_type, parity_url, param1, param2) {
        var options = {
            uri: parity_url,
            body: {
                // "method":"eth_blockNumber",
                // "params":[],
                "id":1,
                "jsonrpc":"2.0"
            },
            headers: {
                'Content-Type': 'application/json',
            },
            json: true // Automatically stringifies the body to JSON
        };

        if (option_type === this.OptionType.GetLastEthBlockNum) {
            options.body.method = "eth_blockNumber";
            options.body.params = [];
        } else if (option_type === this.OptionType.GetEthByBlockNum) {
            options.body.method = "eth_getBlockByNumber";
            options.body.params = [param1, true];
        } else if (option_type === this.OptionType.GetBlockTransCountByHash) {
            options.body.method = "eth_getBlockTransactionCountByHash";
            options.body.params = [param1];
        } else if (option_type === this.OptionType.GetTransByBlockHashAndIndex) {
            options.body.method = "eth_getTransactionByBlockHashAndIndex";
            options.body.params = [param1, param2];
        }
        
        return options;
    },

    /**
     * @method GetLastEthBlockNum
     * @param parity_url: string
     * 
     * @return eth_block_number: base10 number
     */
    GetLastEthBlockNum: async function(parity_url) {
        let options = this.GetOptions(this.OptionType.GetLastEthBlockNum, parity_url);
        
        try {
            var eth_block = await rp.post(options);
            if (eth_block && eth_block.result) {
                return  util.ConvertFrom16To10(eth_block.result);
            } else {
                throw new Error(`Cannot get block number from ${parity_url}.`);
            }
        } catch (error) {
            throw error;
        }
    },

    /**
     * @method GetEthByBlockNum
     * @param parity_url: string
     * @param eth_block_number: base64
     * 
     * @return eth_block: object
     */
    GetEthByBlockNum: async function(parity_url, eth_block_number) {
        let options = this.GetOptions(this.OptionType.GetEthByBlockNum, parity_url, eth_block_number);
        
        try {
            var eth_block = await rp.post(options);
            if (eth_block&& eth_block.result && eth_block.result.hash) {
                return eth_block.result;
            } else {
                let error_message
                if (eth_block.error) {
                    error_message = JSON.stringify(eth_block.error)
                } else {
                    error_message = `Block number ${eth_block_number} does not exist block hash.`;
                }
                throw new Error(error_message);
            }
        } catch (error) {
            throw error;
        }
    },

    /**
     * @method GetBlockTransCountByHash
     * @param parity_url: string
     * @param block_hash: string
     * 
     * @return transaction_count: base10 number
     */
    GetBlockTransCountByHash: async function(parity_url, block_hash) {
        let options = this.GetOptions(this.OptionType.GetBlockTransCountByHash, parity_url, block_hash);
        
        try {
            var block_trans_Count = await rp.post(options);
            if (block_trans_Count.result || block_trans_Count.result===0) {
                return util.ConvertFrom16To10(block_trans_Count.result);
            } else {
                let error_message
                if (block_trans_Count.error) {
                    error_message = JSON.stringify(block_trans_Count.error)
                } else {
                    error_message = `Block hash ${block_hash} does not exist transctions.`;
                }
                throw new Error(error_message);
            }
        } catch (error) {
            throw error;
        }                
    },
    
    /**
     * @method GetTransByBlockHashAndIndex
     * @param parity_url: string
     * @param block_hash: string
     * @param transaction index: base10 number
     * 
     * @return transaction: objcet
     */
    GetTransByBlockHashAndIndex: async function(parity_url, block_hash, index) {    
        let base16_index = util.ConvertFrom10To16(index);
        let options = this.GetOptions(this.OptionType.GetTransByBlockHashAndIndex, parity_url, block_hash, base16_index);

        try {
            let transaction = await rp.post(options);
            if (transaction && transaction.result) {
                return transaction.result;
            } else {
                let error_message
                if (transaction.error) {
                    error_message = JSON.stringify(transaction.error)
                } else {
                    error_message = `Current transaction is not existed.`;
                }
                throw new Error(error_message);
            }
        } catch (error) {
            throw error;
        }
    }
}