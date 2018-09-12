let Start = async function() {
    try {
        let arr = [10,20,30,40,50,60,70,80,90];
        for (let i = 0; i < arr.length; i++) {
            let item = arr[i];
            if (i === 5) continue;
            console.log(arr[i]);
        }
    } catch (error) {
        console.log(error.stack);
        
    }
}

Start();