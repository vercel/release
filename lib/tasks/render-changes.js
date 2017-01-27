'use strict'

// Ours
const {render} = require('../changelog')
const {tap} = require('../promise')
const getCredits = require('./get-credits')
const groupByType = require('./group-by-type')

const description = 'Generating the changelog'

module.exports = config => tap(
  config.progress.wrap(
    async release => {
      const required = []

      if (!release.changes) {
        required.push(groupByType(config)(release))
      }

      if (!release.credits) {
        required.push(getCredits(config)(release))
      }

      await Promise.all(required)

      release.body = render(release, config)
    },
    description
  )
)
