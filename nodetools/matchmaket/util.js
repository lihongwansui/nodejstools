module.exports = {
    ConvertArrayToString: function(arr) {
        let i = 0
        let result = arr.reduce(function(pre, current) {
            if (i === 0) {
                i = i + 1;
                return "'"+pre+"','"+current.toString()+"'";
            } else {
                i = i + 1;
                return pre +",'"+current.toString()+"'";
            }
        })
        
        return result;
    }
};