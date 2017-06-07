// Пример оборачивания функции в песочнице

var fs = require('fs'), vm = require('vm');

function Statistics() {
    var _funcInvokesCount = 0;
    var _callbackInvokesCount = 0;
    var _sumFunctionTime = 0;
    var _sumCallbackTime = 0;

    this.incFuncInvokesCount = function () {
        _funcInvokesCount++;
    };

    this.getFuncInvokesCount = function () {
      return _funcInvokesCount;
    };

    this.incCallbackInvokesCount = function () {
        _callbackInvokesCount++;
    };

    this.getCallbackInvokesCount = function () {
      return _callbackInvokesCount;
    };

    this.addFunctionTime = function (time) {
        _sumFunctionTime += time;
    };

    this.calculateAvgFunctionTime = function () {
        return _sumFunctionTime / _funcInvokesCount;
    };

    this.addCallbackTime = function (time) {
        _sumCallbackTime += time;
    };

    this.calculateAvgCallbackTime = function () {
        return _sumCallbackTime / _callbackInvokesCount;
    }
}

var stat = new Statistics();

function cloneInterface(anInterface) {
    var clone = {};
    for (var key in anInterface) {
        clone[key] = wrapFunction(key, anInterface[key]);
    }

    return clone;
}

function wrapFunction(fnName, fn) {

    return function wrapper() {
        stat.incFuncInvokesCount();

        var args = [];
        Array.prototype.push.apply(args, arguments);
        console.log('Call: ' + fnName);
        console.dir(args);

        // wrap up callback if it exists
        var callback = args[args.length - 1];
        if (typeof callback === 'function') {
            args[args.length - 1] = wrapCallback(fnName, callback);
        }

        //measure function execution time
        var hrstart = process.hrtime();
        var result = fn.apply(undefined, args);
        var hrend = process.hrtime(hrstart);

        //add time measured in milliseconds (hrend[1] - in nanoseconds)
        stat.addFunctionTime(hrend[1] / 1000000);

        return result;
    }
}

function wrapCallback(fnName, callback) {

    return function wrapper() {
        stat.incCallbackInvokesCount();

        var args = [];
        Array.prototype.push.apply(args, arguments);
        console.log(fnName + ' callback args: ');
        console.dir(args);

        var hrstart = process.hrtime();
        var result = callback.apply(undefined, args);
        var hrend = process.hrtime(hrstart);

        //add time measured in milliseconds (hrend[1] - in nanoseconds)
        stat.addCallbackTime(hrend[1] / 1000000);

        return result;
    }
}

// Объявляем хеш из которого сделаем контекст-песочницу
var context = {
    module: {},
    console: console,
    setInterval: setInterval,
    // Помещаем ссылку на fs API в песочницу
    fs: cloneInterface(fs)
};

// Преобразовываем хеш в контекст
context.global = context;
var sandbox = vm.createContext(context);

// Читаем исходный код приложения из файла
var fileName = './application.js';
fs.readFile(fileName, function (err, src) {
    // Запускаем код приложения в песочнице
    var script = vm.createScript(src, fileName);
    script.runInNewContext(sandbox);

    //print statistics every 30 sec in console
    console.log('Updating statistics every 30 secs...');
    setInterval(function () {
        console.log('1) Function invokes count: ' + stat.getFuncInvokesCount());
        console.log('2) Callback invokes count: ' + stat.getCallbackInvokesCount());
        console.log('3) Average function execution time: ' + stat.calculateAvgFunctionTime() + ' ms');
        console.log('4) Average callback execution time: ' + stat.calculateAvgCallbackTime() + ' ms\n');
    }, 30000);
});
