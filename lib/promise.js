'use strict'

const logger = msg => console.log.bind(console, msg)

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
exports.tap = function (labelOrCb = 'tap') {
  const cb = typeof labelOrCb === 'function' ? labelOrCb : logger(labelOrCb)

  return async value => {
    await cb(value)

    return value
  }
}
