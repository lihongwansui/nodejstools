let TestInternal = async function() {
    setInterval(async function() {
        console.log('in in in in in');
        
        await AwaitFun()
        console.log('circulation!!');
    }, 1000);

    
}

let AwaitFun =  function() {
    return new Promise((resolve) => {
        setTimeout(resolve, 5000);
    })
}


TestInternal();


