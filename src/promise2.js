const PENDING = 'PENDING';
const RESOLVED = 'RESOLVED';
const REJECTED = 'REJECTED';

function Promise(executor) {
    var that = this;
    that.status = PENDING;
    that.data = undefined // Promise的值
    that.onResolvedCallback = [] // Promise resolve时的回调函数集，因为在Promise结束之前有可能有多个回调添加到它上面
    that.onRejectedCallback = [] // Promise reject时的回调函数集，因为在Promise结束之前有可能有多个回调添加到它上面
    resolve = (value) => {};
    reject = (value) => {};
    try {
        executor(resolve, reject); // 执行executor并传入相应的参数
    } catch (err) {
        reject(err);
    }
}