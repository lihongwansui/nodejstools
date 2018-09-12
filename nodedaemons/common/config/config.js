let config = {
    "Withdraw_Reason_Code": 2000,   // withdraw funds successfully
    "Withdraw_Lock_Reason_code": 800, // apply withdraw funds
    "Lock_Funds_Code": 2,  // lock funs
    "Unlock_And_Sub_Funds": 5, // unlock funs and sub funds

    // global configs table
    "Global_Configs_Table": "global_configs",
    "Gas_Price_Median_Column": "GAS PRICE MEDIAN",
    "Gas_Price_Median_Des": "最近区块的GAS PRICE的中位数",

    "Date_Formate": "yyyy-mm-dd HH:MM:ss"
}

module.exports = config;