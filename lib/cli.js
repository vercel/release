'use strict'

// Packages
const args = require('args')
const debug = require('debug')('release:cli')

// Ours
const connect = require('./connect')
const progress = require('./progress')
const defaultPipeline = require('./')

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

exports.config = async function (argv = process.argv) {
  const flags = args.parse(argv)
  const config = Object.assign({}, flags, {
    changeTypes,
    progress: progress.create()
  })

  config.github = await connect(config.progress)

  return config
}

exports.start = async function () {
  const config = await exports.config()
  const task = defaultPipeline(config)

  return task().catch(err => {
    config.progress.clear()
      .log('')
      .error(err.message)
    debug(err.stack)
    process.exit(1)
  })
}
