#!/usr/bin/env node

// Packages
const args = require('args')
const asyncToGen = require('async-to-gen/register')
const nodeVersion = require('node-version')
const updateNotifier = require('update-notifier')
const {red} = require('chalk')

// Ours
const pkg = require('../package')

// Support for keywords "async" and "await"
asyncToGen({
  excludes: null
})

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(`${red('Error!')} Now requires at least version 6 of Node. Please upgrade!`)
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (!process.env.NOW) {
  updateNotifier({pkg}).notify()
}

// Load package core with async/await support
const release = require('../')

args
  .option('pre', 'Mark the release as prerelease')
  .option('overwrite', 'If the release already exists, replace it')

const flags = args.parse(process.argv)

release(flags).catch(err => {
  console.error(`${red('Error!')} ${err.stack}`)
  process.exit(1)
})
