const PENDING = 'pending'
const FULLFILED = 'resolved'
const REJECTED = 'rejected'

function resolvePromise (promise, x, resolve, reject) {
    let isCalled
    if (promise === x) {
        return reject(new TypeError('Chaining cycle detected for promise!'))
    }
    if (x instanceof Promise) {
        if (x.status === PENDING) {
            x.then(value => {
                resolvePromise(promise, value, resolve, reject)
            }, reject)
        } else {
            x.then(resolve, reject)
        }
        return
    }
    if ((x !== null && typeof x === 'object') || typeof x === 'function') {
        try {
            let then = x.then
            if (typeof then === 'function') {
                then.call(x, function (y) {
                    if (isCalled) return
                    isCalled = true
                    return resolvePromise(promise, y, resolve, reject)
                }, function (reason) {
                    if (isCalled) return
                    isCalled = true
                    return reject(reason)
                })
            } else {
                resolve(x)
            }
        } catch (e) {
            if (isCalled) return
            isCalled = true
            return reject(e)
        }
    } else {
        resolve(x)
    }
}

class Promise {

    constructor (executor) {
        this.status = PENDING
        this.data = undefined
        this.resolvedCallbacks = []
        this.rejectedCallbacks = []

        const resolve = (value) => {
            if (value instanceof Promise) {
                return value.then(resolve, reject)
            }

            setTimeout(() => {
                if (this.status === PENDING) {
                    this.status = FULLFILED
                    this.data = value

                    this.resolvedCallbacks.forEach(cb => {
                        cb(value)
                    })
                }
            })
        }

        const reject = (reason) => {
            setTimeout(() => {
                if (this.status === PENDING) {
                    this.status = REJECTED
                    this.data = reason

                    this.rejectedCallbacks.forEach(cb => {
                        cb(reason)
                    })
                }
            })
        }

        try {
            executor(resolve, reject)
        } catch (e) {
            reject(e)
        }
    }

    then (onResolved, onRejected) {
        let promise2
        onResolved = typeof onResolved === 'function' ? onResolved : val => val
        onRejected = typeof onRejected === 'function' ? onRejected : reason => {
            throw reason
        }
        switch (this.status) {
            case PENDING:
                return promise2 = new Promise((resolve, reject) => {

                    this.resolvedCallbacks.push(function (value) {
                        try {
                            const x = onResolved(value)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    })
                    this.rejectedCallbacks.push(function (reason) {
                        try {
                            const x = onRejected(reason)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    })
                })
                break
            case FULLFILED:
                return promise2 = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            const x = onResolved(this.data)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    })
                })
            case REJECTED:
                return promise2 = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            const x = onRejected(this.data)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e)
                        }
                    })
                })
        }
    }

    catch (onRejected) {
        return this.then(null, onRejected)
    }
}

Promise.deferred = Promise.defer = function () {
    var dfd = {}
    dfd.promise = new Promise(function (resolve, reject) {
        dfd.resolve = resolve
        dfd.reject = reject
    })
    return dfd
}

module.exports = Promise