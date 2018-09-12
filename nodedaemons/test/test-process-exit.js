let Init = function() {
    try {
        throw new Error("This is a error")
    } catch (error) {
        index = index + 1;
        console.log(index);
        console.log(error.stack);
        setTimeout(() => {
            Init()
        }, 2000);
    }
}

let index = 0

Init();