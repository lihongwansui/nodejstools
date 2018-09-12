var Tables = require("./tables.js");

const sql = {
	MEMBER_TODAY_ETH_CAL : "INSERT INTO " + Tables.MEMBER_CB_ALLOCATE_DETAILS + " (member_id,origin_volumn,created_at,trade_day)"
			+ " SELECT t.member_id,SUM(t.ethCnt) as originVolumn, NOW(), ? FROM ("
			+ " SELECT ask_member_id AS member_id,funds AS ethCnt"
			+ " FROM " + Tables.TRADES + " WHERE created_at BETWEEN ? and ?"
			+ " UNION ALL "
			+ " SELECT bid_member_id AS member_id,funds AS ethCnt"
			+ " FROM " + Tables.TRADES + " WHERE created_at BETWEEN ? and ?) t group by t.member_id",
	PLATFORM_ETH_CAL : "INSERT INTO " + Tables.MEMBER_CB_ALLOCATE_DETAILS + "(member_id,created_at,trade_day,chubi_volumn, updated_at) "
			+ " SELECT (SELECT VALUE FROM " + Tables.GLOBAL_CONFIGS + " WHERE name = 'CHUBI_MEMBER_ID'),NOW(),?,((SELECT VALUE FROM " + Tables.GLOBAL_CONFIGS 
			+ " WHERE name = 'ALLOCATE_VOL') * (SELECT 100-VALUE FROM " + Tables.GLOBAL_CONFIGS + " WHERE name = 'PROFIT_RATE') / 100), now()",
	
	UPDATE_RATE : "update " + Tables.MEMBER_CB_ALLOCATE_DETAILS + " set rate = ? where member_id = ? and trade_day = ?",
	
	UPDATE_CHUBI_VOLUMN : "update " + Tables.MEMBER_CB_ALLOCATE_DETAILS + " set rate = ?,ext_volumn = ?, "
				+ " invite_level_vol_1 = ?, invite_level_vol_2 = ?, chubi_volumn = ?, updated_at = now(), super_level_vol = ? where member_id = ? and trade_day = ?",
				
	CLEAN_PROFIT_SUMMARY : "delete from " + Tables.PLATFORM_PROFITS_SUMMARY + " where summary_day = ?",
	
	CLEAN_PROFIT_DETAIL : "delete from " + Tables.PLATFORM_PROFITS_DETAIL + " where profit_day = ?",
	
	CLEAN_CHUBI_ALLOCATE : "delete from " + Tables.MEMBER_CB_ALLOCATE_DETAILS + " where trade_day = ?" ,
	
	INSERT_PROFIT_SUMMARY : "INSERT INTO " + Tables.PLATFORM_PROFITS_SUMMARY + "(currency,fee,created_at,summary_day)"
						+ " SELECT currency,SUM(fee) AS totalFee, NOW(), ? "
						+ " FROM " + Tables.ACCOUNT_VERIONS + " WHERE created_at BETWEEN ? and ? AND modifiable_type = 'Trade' AND fee > 0 "
						+ " GROUP BY currency",
						
	INSERT_PROFIT_DETAIL : "INSERT INTO " + Tables.PLATFORM_PROFITS_DETAIL + " (member_id, profit, currency, profit_day) values (?,?,?,?)",	
	
	UPDATE_PROFIT_DETAIL_ACCOUNT_ID : "UPDATE " + Tables.PLATFORM_PROFITS_DETAIL + " d "
								+ " SET account_id = (SELECT id FROM " + Tables.ACCOUNTS + " WHERE d.member_id = member_id AND d.currency = currency)" 
								+ " WHERE profit_day = ? AND EXISTS (SELECT 1 FROM " + Tables.ACCOUNTS + " WHERE d.member_id = member_id AND d.currency = currency)",
	
	INSERT_UNMATCHED_ALLOCATE_DETAIL : "INSERT INTO " + Tables.MEMBER_CB_ALLOCATE_DETAILS 
		+ "(member_id,trade_day,ext_volumn,invite_level_vol_1,invite_level_vol_2) values (?,?,?,?,?)",
	
	QUERY_PROFITS_SUMMARY : "SELECT currency, fee FROM " + Tables.PLATFORM_PROFITS_SUMMARY + " where summary_day = ?",
											
	QUERY_MEMBER_TOTAL_CB : "SELECT member_id, SUM(chubi_volumn) as totalChubi FROM " + Tables.MEMBER_CB_ALLOCATE_DETAILS + " where trade_day <= ? GROUP BY member_id",
				
	QUERY_MEMBER_TOTAL_ETH : "SELECT SUM(origin_volumn) as totalETH, member_id,(SELECT invite_node from " + Tables.MEMBERS + " where id = a.member_id) as invite_node, (SELECT super_node from " + Tables.MEMBERS + " where id = a.member_id) as root FROM " 
						+ Tables.MEMBER_CB_ALLOCATE_DETAILS + " a WHERE trade_day = ? and member_id != ? GROUP BY member_id",
						
	QUERY_MEMBER_HIS_ETH : "SELECT SUM(origin_volumn + ext_volumn) as totalETH, member_id FROM " 
						+ Tables.MEMBER_CB_ALLOCATE_DETAILS + " WHERE trade_day < ? and member_id != ? GROUP BY member_id",
	
	QUERY_CONFIG_VALUE : "select value from " + Tables.GLOBAL_CONFIGS + " where name = ?",

	QUERY_PROFIT_QUOTES : "select * from " + Tables.PROFIT_QUOTES,
	
	QUERY_LEVEL_CONFIG_VALUE : "select value,name from " + Tables.GLOBAL_CONFIGS + " where name in ('INTRODUCE_LEVEL_1', 'INTRODUCE_LEVEL_2')",
	
  QUERY_CB_CONFIG_VALUE : "select value,name from " + Tables.GLOBAL_CONFIGS + " where name in ('ALLOCATE_VOL', 'PROFIT_RATE')",
  
	QUERY_ROOT_RATE_CONFIG_VALUE : "select value,name from " + Tables.GLOBAL_CONFIGS + " where name = 'ROOT_RATE'",
	
	QUERY_SUB_CHILDREN_ETH : "SELECT d.origin_volumn,m.invite_node,d.member_id"
			 + " FROM " + Tables.MEMBER_CB_ALLOCATE_DETAILS + " d, "
       + Tables.MEMBERS + " m WHERE trade_day = ? AND d.member_id = m.id AND m.invite_node IS NOT NULL",
       
};

module.exports = sql;