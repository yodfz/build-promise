// 选择使用哪种microtask实现
const asyncFn = function() {
    if (typeof process === 'object' && process !== null && typeof(process.nextTick) === 'function')
        return process.nextTick;
    if (typeof(setImmediate === 'function'))
        return setImmediate;
    return setTimeout;
}();
// promise状态
const PENDING = 'PENDING';
const RESOLVED = 'RESOLVED';
const REJECTED = 'REJECTED';

// Constructor
function MimiPromise(executor) {
    //当前状态
    this.state = PENDING;
    // 回填数据
    this.executedData = undefined;
    // 维护的每个注册 then 方法需要返回的新的promise
    this.multiPromise2 = [];
    // 成功
    resolve = (value) => {
            settlePromise(this, RESOLVED, value);
        }
        // 失败
    reject = (reason) => {
        settlePromise(this, REJECTED, reason);
    }
    executor(resolve, reject);
}


function settlePromise(promise, executedState, executedData) {
    if (promise.state !== PENDING)
        return
    promise.state = executedState
    promise.executedData = executedData
    if (promise.multiPromise2.length > 0) {
        const callbackType = executedState === RESOLVED ? "resolvedCallback" : "rejectedCallback"
        for (promise2 of promise.multiPromise2) {
            asyncProcessCallback(promise, promise2, promise2[callbackType])
        }
    }
}

MimiPromise.prototype.then = function(resolvedCallback, rejectedCallback) {
    let promise2 = new MimiPromise(() => {})
    if (typeof resolvedCallback === "function") {
        promise2.resolvedCallback = resolvedCallback;
    }
    if (typeof rejectedCallback === "function") {
        promise2.rejectedCallback = rejectedCallback;
    }
    if (this.state === PENDING) {
        this.multiPromise2.push(promise2)
    } else if (this.state === RESOLVED) {
        asyncProcessCallback(this, promise2, promise2.resolvedCallback)
    } else if (this.state === REJECTED) {
        asyncProcessCallback(this, promise2, promise2.rejectedCallback)
    }
    return promise2
}

function asyncProcessCallback(promise, promise2, callback) {
    asyncFn(() => {
        if (!callback) {
            settlePromise(promise2, promise.state, promise.executedData);
            return;
        }
        let x
        try {
            x = callback(promise.executedData)
        } catch (e) {
            settlePromise(promise2, REJECTED, e)
            return
        }
        settleWithX(promise2, x)
    })
}

function settleWithX(p, x) {
    if (x === p && x) {
        settlePromise(p, REJECTED, new TypeError("promise_circular_chain"));
        return;
    }
    var xthen, type = typeof x;
    if (x !== null && (type === "function" || type === "object")) {
        try {
            xthen = x.then;
        } catch (err) {
            settlePromise(p, REJECTED, err);
            return;
        }
        if (typeof xthen === "function") {
            settleXthen(p, x, xthen);
        } else {
            settlePromise(p, RESOLVED, x);
        }
    } else {
        settlePromise(p, RESOLVED, x);
    }
    return p;
}

function settleXthen(p, x, xthen) {
    try {
        xthen.call(x, function(y) {
            if (!x) return;
            x = null;
            settleWithX(p, y);
        }, function(r) {
            if (!x) return;
            x = null;
            settlePromise(p, REJECTED, r);
        });
    } catch (err) {
        if (x) {
            settlePromise(p, REJECTED, err);
            x = null;
        }
    }
}