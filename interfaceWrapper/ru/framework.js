// Пример оборачивания функции в песочнице
'use strict';
const fs = require('fs'), vm = require('vm');

function Statistics() {
  let funcInvokesCount = 0;
  let callbackInvokesCount = 0;
  let sumFunctionTime = 0;
  let sumCallbackTime = 0;

  this.incFuncInvokesCount = function() {
    funcInvokesCount++;
  };

  this.getFuncInvokesCount = function() {
    return funcInvokesCount;
  };

  this.incCallbackInvokesCount = function() {
    callbackInvokesCount++;
  };

  this.getCallbackInvokesCount = function() {
    return callbackInvokesCount;
  };

  this.addFunctionTime = function(time) {
    sumFunctionTime += time;
  };

  this.calculateAvgFunctionTime = function() {
    return sumFunctionTime / funcInvokesCount;
  };

  this.addCallbackTime = function(time) {
    sumCallbackTime += time;
  };

  this.calculateAvgCallbackTime = function() {
    return sumCallbackTime / callbackInvokesCount;
  };
}

const stat = new Statistics();

function cloneInterface(anInterface) {
  const clone = {};
  for (const key in anInterface) {
    clone[key] = wrapFunction(key, anInterface[key]);
  }

  return clone;
}

function wrapFunction(fnName, fn) {

  return function wrapper(...params) {
    stat.incFuncInvokesCount();

    const args = [];
    Array.prototype.push.apply(args, params);
    console.log('Call: ' + fnName);
    console.dir(args);

    // wrap up callback if it exists
    const callback = args[args.length - 1];
    if (typeof callback === 'function') {
      args[args.length - 1] = wrapCallback(fnName, callback);
    }

    //measure function execution time
    const hrstart = process.hrtime();
    const result = fn(...args);
    const hrend = process.hrtime(hrstart);

    //add time measured in milliseconds (hrend[1] - in nanoseconds)
    stat.addFunctionTime(hrend[1] / 1000000);

    return result;
  };
}

function wrapCallback(fnName, callback) {

  return function wrapper(...params) {
    stat.incCallbackInvokesCount();

    const args = [];
    Array.prototype.push.apply(args, params);
    console.log(fnName + ' callback args: ');
    console.dir(args);

    const hrstart = process.hrtime();
    const result = callback(...args);
    const hrend = process.hrtime(hrstart);

    //add time measured in milliseconds (hrend[1] - in nanoseconds)
    stat.addCallbackTime(hrend[1] / 1000000);

    return result;
  };
}

// Объявляем хеш из которого сделаем контекст-песочницу
const context = {
  module: {},
  console,
  setInterval,
  // Помещаем ссылку на fs API в песочницу
  fs: cloneInterface(fs)
};

// Преобразовываем хеш в контекст
context.global = context;
const sandbox = vm.createContext(context);

// Читаем исходный код приложения из файла
const fileName = './application.js';
fs.readFile(fileName, (err, src) => {
  // Запускаем код приложения в песочнице
  const script = vm.createScript(src, fileName);
  script.runInNewContext(sandbox);

  //print statistics every 30 sec in console
  console.log('Updating statistics every 30 secs...');
  setInterval(() => {
    console.log('1) Function invokes count: ' + stat.getFuncInvokesCount());
    console.log('2) Callback invokes count: ' + stat.getCallbackInvokesCount());
    console.log('3) Average function execution time: ' +
      stat.calculateAvgFunctionTime() + ' ms');
    console.log('4) Average callback execution time: ' +
      stat.calculateAvgCallbackTime() + ' ms\n');
  }, 30000);
});
