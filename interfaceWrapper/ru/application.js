'use strict';

const fileName = './README.md';
console.log('Application going to analyze ' + fileName);

setInterval(() => {
  fs.stat(fileName, (err, stats) => {
    console.log('isFile property value: ' + stats.isFile());
  });
}, 10000);
