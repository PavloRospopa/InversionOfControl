var fileName = './README.md';
console.log('Application going to analyze ' + fileName);

setInterval(function () {
    fs.stat(fileName, function (err, stats) {
        console.log('isFile property value: ' + stats.isFile());
    });
}, 10000);