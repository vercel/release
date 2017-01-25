'use strict'

/**
 * Create a pass-through promise handler used to observe the value in a promise
 * chain.
 *
 * Unless cb throws or returns a rejecting promise, the promise handler will
 * return the value it originally received.
 *
 * @param  {function|string} labelOrCb Called with the value passing through
 * @return {function(any): Promise<any,Error>}
 */
exports.tap = function (cb) {
  return async value => {
    await cb(value)

    return value
  }
}

/**
 * Create a pass-through promise error handler used to observe the error.
 *
 * @param  {function|string} labelOrCb Called with the error passing through
 * @return {function(Error): Promise<Error>}
 */
exports.tap.error = function (cb) {
  return async err => {
    await cb(err)

    return Promise.reject(err)
  }
}

/**
 * Call the function and capture any thrown error to reject the returned promise
 *
 * @param  {function} fn   Function to call
 * @param  {...any}   args Arguments to call the function with
 * @return {Promise<any,Error>}
 */
exports.try = async function (fn, ...args) {
  return fn(...args)
}
