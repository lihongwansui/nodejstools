let array = [1]

let GetArr = function(arr) {
    if (arr && arr.length === 1) {
        return arr[0].toString();
    }
    let result = arr.reduce(function(pre, current) {
        if (pre === arr[0]) {
            return "'"+pre+"','"+current.toString()+"'";
        } else {
            return pre +",'"+current.toString()+"'";
        }
    })
    return result;
}

let ret = GetArr(array);

console.log(ret);
