module.exports = {
    get_order_script: "SELECT `orders`.* FROM `orders` WHERE `orders`.`id` = ? LIMIT 1 FOR UPDATE;",
    insert_trade_script: "INSERT INTO `trades` (`ask_id`, `ask_member_id`, `bid_id`, `bid_member_id`, `created_at`, `currency`, `funds`, `price`, `trend`, `updated_at`, `volume`) VALUES (?)",
    get_member_script: "SELECT `members`.* FROM `members` WHERE `members`.`id` = ? LIMIT 1;",
    get_account_script: "SELECT `accounts`.* FROM `accounts` WHERE `accounts`.`member_id` = ? AND `accounts`.`currency` = ? ORDER BY `accounts`.`id` ASC LIMIT 1;",
    update_account_script: "update accounts set balance = ?, locked = ? where id = ?;",
    insert_av_script: "INSERT INTO account_versions (fun,fee,reason,amount,currency,member_id,account_id,modifiable_id,modifiable_type,locked,balance,created_at,updated_at) VALUES (?);",
    
};
