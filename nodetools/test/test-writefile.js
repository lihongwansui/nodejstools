const fs = require('fs');

let file_path = "D:\\mywork-git\\nodejobs\\nodetools\\test\\text.txt";
fs.stat(file_path, (err, data) => {
    console.log(__dirname);
    
    if (err) {
        console.log(err.stack);
    } else {
        console.log(JSON.stringify(data));
    }
})

