'use strict'

// Ours
const {create: newRelease} = require('../release')
const {getRepo} = require('../repo')

module.exports = config => async (release = newRelease(config)) => {
  const details = await getRepo()

  return Object.assign(release, details)
}
