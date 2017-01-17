'use strict'

// Native
const path = require('path')

class PluginArray extends Array {

  /**
   * Add a plugin to the list of plugins
   *
   * @param  {...object} plugins Map event name to handlers
   * @return {number}            Number of registered plugins
   */
  register(...plugins) {
    this.push(...plugins)
  }

  /**
   * Run action (if required) and the plugins handler (if required) associated
   * to the action name.
   *
   * Plugin handlers should be named like the action name prefixed with "before"
   * (to run ahead of the action handler) or "after" (to run after).
   *
   * "before*" plugin handler and the defualt handler will run only if required;
   * "after*" plugin handlers are always called.
   *
   * @param  {string}   action.name     Name of the event
   * @param  {function} action.handler  Default action for the event
   * @param  {function} action.required Test if the action is required
   * @param  {...any}   args            Arguments to run handlers with
   * @return {Promise<void,Error>}
   */
  async run(action, ...args) {
    await this.runBefore(action, ...args)
    await this.runAction(action, ...args)
    await this.runAfter(action, ...args)
  }

  /**
   * Run "before*" handlers in sequence while default action is required.
   *
   * @param  {string}   action.name     Name of the event
   * @param  {function} action.required Test if the action is required
   * @param  {...any}   args            Arguments to run handlers with
   * @return {Promise<void,Error>}
   */
  async runBefore({name, required = alwaysRequired}, ...args) {
    const handlerName = `before${name}`

    for (const plugin of this) {
      if (!await required(...args)) {
        return
      }

      if (typeof plugin[handlerName] !== 'function') {
        continue
      }

      await plugin[handlerName](...args)
    }
  }

  /**
   * Run default action if required
   *
   * @param  {function} action.handler   Default action for the event
   * @param  {function} action.required  Test if the action is required
   * @param  {...any}   args             Arguments to run handlers with
   * @return {Promise<void,Error>}
   */
  async runAction({handler = noop, required = alwaysRequired}, ...args) {
    if (await required(...args)) {
      await handler(...args)
    }
  }

  /**
   * Run "after*" handlers in sequence.
   *
   * @param  {string} action.name Name of the event
   * @param  {...any} args        Arguments to run handlers with
   * @return {Promise<void,Error>}
   */
  async runAfter({name}, ...args) {
    const handlerName = `after${name}`

    for (const plugin of this) {
      if (typeof plugin[handlerName] !== 'function') {
        continue
      }

      await plugin[handlerName](...args)
    }
  }

}

/**
 * Create a plugin handler
 *
 * @param  {...object} list List of plugins
 * @return {PluginArray}
 */
exports.create = function (...list) {
  return new PluginArray(...list)
}

/**
 * Load plugins.
 *
 * @param  {string}   listTxt List of plugin name separated by ":"
 * @param  {Array}    options.init   Arguments to initiate plugin with (if it's a function)
 * @param  {function} options.loader Loader (default to require)
 * @return {PluginArray}
 */
exports.load = function (listTxt = '', {init = [], loader = require} = {}) {
  const list = listTxt.split(':').filter(
    name => name.length > 0
  ).map(name => {
    if (name.startsWith('.')) {
      return loader(path.resolve(name))
    }

    if (name.startsWith('/')) {
      return loader(name)
    }

    return loader(`release-plugin-${name}`)
  }).map(mod => {
    if (typeof mod !== 'function') {
      return mod
    }

    return mod(...init)
  })

  return new PluginArray(...list)
}

function alwaysRequired() {
  return true
}

function noop() {}
