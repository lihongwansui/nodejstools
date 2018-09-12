const async = require('async');

let WaitFunc = async function(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms, 'done');
    });
}

let TestAwaitFun = async function(ms){
    await WaitFunc(ms)
}

let GetValue = async function(ms) {
    await WaitFunc(ms);
    return ms;
}

let TestPromiseAll = async function() {
    return new Promise((resolve, reject) => {
        var arr = [2000, 3000, 3000, 3000, 3000, 2000,3000,3000,3000];
        async.mapLimit(arr, 9, async function(item) {
            return await GetValue(item);
        }, (err, results) => {
            if (err) reject(err);
            console.log(">>>" + JSON.stringify(results));            
            resolve(results);
        })
    })
}

// TestPromiseAll().then((data) => {
//     console.log(JSON.stringify(data));
// });

let GetTestPromise = async function() {
    let result = await TestPromiseAll();
    console.log(result);
}

GetTestPromise();

