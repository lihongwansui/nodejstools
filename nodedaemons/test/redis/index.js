const Redis = require('../../common/redis');

let Start = async function() {
    let config = Redis.GetRedisConfig();
    console.log(JSON.stringify(config));
    
    let key = "name";
    let value = "yy";
    let ret01 = await Redis.SetValueByKey(key, value);
    console.log(JSON.stringify(ret01));

    let ret02 = await Redis.GetValueByKey(key);
    console.log(JSON.stringify(ret02));
}

Start();