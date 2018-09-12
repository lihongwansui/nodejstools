const wraptransaction = require('../common/mysql/wraptransaction');

let sql_script1 = "update withdraws set aasm_state = 'done' where id = 110";
let sql_script2 = "update withdraws set aasm_state = 'done' where id = 111";

let sql_scripts = [];
sql_scripts.push(sql_script1);
sql_scripts.push(sql_script2);

let DoTest = async function(sql_script1, sql_script2, sql_scripts) {
    try {
        // let result = await wraptransaction.QueryDB(sql_script1, sql_script2);
        // console.log(result);

        let result = await wraptransaction.QueryDBPromise(sql_scripts);
        console.log("result >>>>>>>><<<<<<" + JSON.stringify(result));        
    } catch (error) {
        console.log("error >>>>>>>>><<<<<<" + error.stack);
    }
}

DoTest(sql_script1, sql_script2, sql_scripts)