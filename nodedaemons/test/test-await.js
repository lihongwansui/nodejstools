let Main =  function() {
    console.log('Starting');
    var result = AwaitFun(3000);
    console.log(result);
    
    console.log('Ending');
}

let AwaitFun = async function(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    })
}

Main();

