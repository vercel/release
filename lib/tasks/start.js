'use strict'

// Ours
const {create: newRelease} = require('../release')
const {getRepo} = require('../repo')
const inSync = require('./in-sync')

module.exports = config => async (release = newRelease(config)) => {
  const [details] = await Promise.all([
    getRepo(),
    inSync(config)(release)
  ])

  return Object.assign(release, details)
}
