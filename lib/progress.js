'use strict'

// Package
const ora = require('ora')
const chalk = require('chalk')

const noop = () => {}
const fakeSpinner = Object.freeze({
  isFake: true,
  start: noop,
  stop: noop,
  clear: noop,
  succeed: noop,
  fail: noop
})

class Progress {

  constructor({stream = process.stderr, spinner = ora, colors = new chalk.constructor()} = {}) {
    this.stream = stream
    this.newSpinner = text => spinner({stream: this.stream, text})
    this.colors = colors
    this.queue = []
  }

  get spinner() {
    const details = this.queue.slice(-1).pop()

    if (details) {
      return details.spinner
    }

    return fakeSpinner
  }

  pause(msg) {
    this.spinner.stop()

    if (msg !== undefined) {
      this.stream.write(`${msg}\n`)
    }

    return this
  }

  restart() {
    this.spinner.start()

    return this
  }

  add(id) {
    this.pause()
    this.queue.push({
      id,
      spinner: this.newSpinner(id).start()
    })

    return [
      val => {
        this.succeed(id)

        return val
      },
      err => {
        this.fail(id)

        return Promise.reject(err)
      }
    ]
  }

  dequeue(id) {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].id === id) {
        const spinner = this.queue[i].spinner

        this.queue.splice(i, 1)

        return spinner
      }
    }
  }

  clear() {
    this.pause()
    this.queue = []

    return this
  }

  log(msg) {
    this.pause(msg)

    return this
  }

  info(msg) {
    return this.log(this.colors.cyan(`  ${msg}`))
  }

  warn(msg) {
    return this.log(this.colors.yellow(`  ${msg}`))
  }

  error(msg) {
    return this.log(this.colors.red(`  ${msg}`))
  }

  succeed(id) {
    this.dequeue(id).succeed()

    return this.restart()
  }

  fail(id) {
    this.dequeue(id).fail()

    return this.restart()
  }

  wrap(fn, id) {
    return async (...args) => fn(...args).then(...this.add(id))
  }

}

exports.create = spinner => new Progress(spinner)
