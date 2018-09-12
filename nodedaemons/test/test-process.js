let Start = async function() {
    try {
        setInterval(() => {
            console.log('in >');
        }, 1000)
    } catch (error) {
        console.log(error.stack);
        
    }
}

process.on('exit', () => {
    console.log('exit');
})

process.on('uncaughtException', () => {
    console.log('uncaughtException');
})

Start();