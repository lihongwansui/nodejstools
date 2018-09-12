let WaitFun = async function () {
    await new Promise(function (resolve) {
        setTimeout(resolve, 2000);
    })
}


let GetStatus = function () {
    return {status: 1}
}


let ExecuteFun = async function() {
    let result = GetStatus();
     console.log(JSON.stringify(result.status));
    while (!result.status) {        
        console.log('in in in');
        let result = GetStatus();  
        console.log(JSON.stringify(result));
        await WaitFun();
        
    }
    console.log(JSON.stringify(result));
}

ExecuteFun();