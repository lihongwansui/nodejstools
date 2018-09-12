let mySql = require("../common/mysql/index.js");

let Init = async function() {
    try {
        let scripts = "SELECT  id, txid,aasm_state,fee,sum,account_id,member_id FROM `withdraws` where aasm_state = 'almost_done' and currency = '9'";
        
        let ret = await mySql.QueryDB(scripts);; 

        console.log(JSON.stringify(ret.length));
        
    } catch (error) {
        console.log(error.stack);
    }
}

Init();
