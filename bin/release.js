#!/usr/bin/env node

// Packages
const asyncToGen = require('async-to-gen/register')
const nodeVersion = require('node-version')
const updateNotifier = require('update-notifier')
const {red} = require('chalk')

// Ours
const pkg = require('../package')

// Support for keywords "async" and "await"
const pathSep = process.platform === 'win32' ? '\\\\' : '/'

asyncToGen({
  includes: new RegExp(`.*release?${pathSep}(lib|bin).*`),
  excludes: null,
  sourceMaps: false
})

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  // eslint-disable-next-line no-console
  console.error(`${red('Error!')} Now requires at least version 6 of Node. Please upgrade!`)
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (pkg.dist) {
  updateNotifier({pkg}).notify()
}

// Load package core with async/await support
const cli = require('../lib/cli')

cli.start()
