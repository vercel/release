#!/usr/bin/env node

// Packages
const args = require('args')
const debug = require('debug')('release')
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
  // eslint-disable-next-line no-console
  console.error(`${red('Error!')} Now requires at least version 6 of Node. Please upgrade!`)
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (!process.env.NOW) {
  updateNotifier({pkg}).notify()
}

// Load package core with async/await support
const defaulPipeline = require('../')
const {create: newProgress} = require('../lib/progress')

const changeTypes = [
  {
    handle: 'major',
    name: 'Major Change',
    description: 'incompatible API change'
  },
  {
    handle: 'minor',
    name: 'Minor Change',
    description: 'backwards-compatible functionality'
  },
  {
    handle: 'patch',
    name: 'Patch',
    description: 'backwards-compatible bug fix'
  }
]

args
  .option('pre', 'Mark the release as prerelease')
  .option('overwrite', 'If the release already exists, replace it')

const flags = args.parse(process.argv)
const progress = newProgress()
const config = Object.assign({}, flags, {
  changeTypes,
  progress
})
const task = defaulPipeline(config)

task().catch(err => {
  progress.clear()
    .log('')
    .error(err.message)
  debug(err.stack)
  process.exit(1)
})
