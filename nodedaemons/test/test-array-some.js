let Start = async function() {
    try {
        let obj_array = [{name: "zhangsan", age: 20}, {name: "lisi", age: 21}, {name: "wangwu", age: 22}, {name: "zhaoliu", age: 23}]
        let isExisted = obj_array.some((item) => {
            return item.name.toLocaleLowerCase() === "lisi".toLocaleLowerCase();
        });       
        console.log(`Result is ${isExisted}`);
    } catch (error) {
        console.log(error.stack);
    }
}

let FilterArray = async function() {
    try {
        let target_transaction_list = [{txid: 'qazwsx', name: 'yy01'},{txid: 'wsxedc', name: 'yy02'},{txid: 'edcrfv', name: 'yy03'},{txid: 'rfvtgb', name: 'yy04'},{txid: 'tgbyhn', name: 'yy05'},{txid: 'yhnujm', name: 'yy06'}];

        let backup_data = ['qazwsx', 'edcrfv', 'yhnujm', '12313', '45675', '7891', 'wsxedc', 'rfvtgb'];

        let ret = backup_data.filter((txid) => {
            return txid && !CheckTxidIsExisted(target_transaction_list, txid);
        });
        console.log(JSON.stringify(ret));
        
    } catch (error) {
        console.log(error.stack);
    }
}

let CheckTxidIsExisted = function(txid_list, txid) {
    try {
        return txid_list.some((item) => {
            return item.txid.toLowerCase() == txid.toLowerCase();
        });
    } catch (error) {
        throw error;
    }
}

FilterArray();

// Start()

