const path = require('path');
const fs = require('fs');
let backup_path = path.join(__dirname, '../backupfolder/usdt_backup_number.txt');

let Start = async function() {
    try {
        let origin_arr = ["10", "20", "30"]
        // fs.writeFileSync(backup_path, origin_arr, 'utf8')

        let transform_ret = fs.readFileSync(backup_path, 'utf8');
        // let transform_ret = ret.toString('utf-8');
        let target_arr = transform_ret !== '' ? transform_ret.split(`,`): [];
        let length = target_arr.length;
        console.log(length);
        console.log(target_arr[0] === '');

        target_arr.push("40");
        // target_arr.shift();
        console.log(target_arr);
        fs.writeFileSync(backup_path, target_arr)
    } catch (error) {
        console.log(error.stack);
    }
}

Start();