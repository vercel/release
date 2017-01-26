'use strict'

// Ours
const connect = require('../connect')
const {create: newRelease} = require('../release')
const {getRepo} = require('../repo')
const inSync = require('./in-sync')

module.exports = config => async (release = newRelease(config)) => {
  const [details] = await Promise.all([
    getRepo(),
    inSync(config)(release)
  ])

  release.client = await connect(config.progress)

  return Object.assign(release, details)
}
