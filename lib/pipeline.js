/**
 * Combine tasks
 *
 * @typedef {function(release: Release): Promise<Release,Error>} Task
 * @typedef {function(config: object): Task} TaskFactory
 */

'use strict'

/**
 * Initialize all tasks and return a new task running all tasks serially
 *
 * @param  {object}         config    Tasks options
 * @param  {...TaskFactory} factories Task constructor
 * @return {Task}
 */
exports.serial = function (config, ...factories) {
  if (factories.length < 1) {
    return release => Promise.resolve(release)
  }

  const tasks = factories.map(task => task(config))

  return async release => {
    let chain = tasks[0](release)

    for (const task of tasks.slice(1)) {
      chain = chain.then(task)
    }

    return chain
  }
}

/**
 * Initialize all tasks and return a new task running all tasks concurrently
 *
 * @param  {object}         config    Tasks options
 * @param  {...TaskFactory} factories Task constructor
 * @return {Task}
 */
exports.parallel = function (config, ...factories) {
  const tasks = factories.map(task => task(config))

  return async release => {
    await Promise.all(tasks.map(task => task(release)))

    return release
  }
}
