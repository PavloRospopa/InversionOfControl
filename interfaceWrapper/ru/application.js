var fileName = './README.md';
console.log('Application going to read ' + fileName);

fs.readFile(fileName, function (err, src) {
    console.log('File ' + fileName + ' size ' + src.length);
});

fs.stat(fileName, function (err, stats) {
    console.log('is file stat val: ' + stats.isFile());
});