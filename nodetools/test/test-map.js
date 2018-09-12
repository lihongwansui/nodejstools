let arr = [{contractid: 1, balance: 18, user: 5}, {contractid: 2, balance: 20, user: 5}, {contractid: 3, balance: 20, user: 5}, {contractid: 4, balance: 20, user: 5}, {contractid: 5, balance: 19, user: 5}, {contractid: 6, balance: 20, user: 5}];

let contract_list = [{id: 2, name: "test02"}, {id: 3, name: "test03"}]

let result = [];
// contract_list.forEach(function(contract) {
//     arr = arr.map(function(item) {
//         if (item.contractid === contract.id) {
//             item.addOne = "ADD";
//         }
//         return item;
//     })
// })

arr = arr.map(function(item) {
    contract_list.forEach(function(contract) {
        if (item.contractid === contract.id) {
            item.addOne = "ADD001";
        }
    })
    return item;
})

console.log(JSON.stringify(arr));
console.log(">>>>>>" + arr.length);