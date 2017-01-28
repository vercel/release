'use strict'

// Native
const path = require('path')

// Packages
const args = require('args')
const debug = require('debug')('release:cli')

// Ours
const connect = require('./connect')
const progress = require('./progress')
const release = require('./')

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
  .option(['e', 'plugin'], 'Rewrite default release pipeline')

function defaultPipelineFactory() {
  try {
    return require(path.resolve('./release.js'))
  } catch (err) {
    return release
  }
}

function pipelineFactory(config) {
  if (!config.plugin) {
    return defaultPipelineFactory()
  }

  if (config.plugin.startsWith('/')) {
    return require(config.plugin)
  }

  if (config.plugin.startsWith('.')) {
    return require(path.resolve(config.plugin))
  }

  return require(`release-plugin-${config.plugin}`)
}

exports.config = async function (argv = process.argv) {
  const flags = args.parse(argv)
  const config = Object.assign({}, flags, {
    changeTypes,
    progress: progress.create()
  })

  config.github = await connect(config.progress)

  return config
}

exports.pipeline = async function (config) {
  const taskFactory = pipelineFactory(config)

  return taskFactory(config)
}

exports.start = async function () {
  const config = await exports.config()
  const task = await exports.pipeline(config)
  const releaseObj = release.release(config)

  return task(releaseObj).catch(err => {
    config.progress.clear()
      .log('')
      .error(err.message)
    debug(err.stack)
    process.exit(1)
  })
}
