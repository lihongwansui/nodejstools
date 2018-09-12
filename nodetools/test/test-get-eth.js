const eth_list = require('../common/currencies');

let Start = function() {
    let arr = eth_list.filter((item) => {
        return item.type === 'Ethereum';
    });
    let tem_arr = [];
    let ret = arr.map(a => tem_arr.push(a.code));

    console.log(ret);
};

Start();
