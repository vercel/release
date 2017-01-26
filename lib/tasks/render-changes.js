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
      if (release.changes && release.credits) {
        release.body = render(release, config)
        return
      }

      await Promise.all([
        groupByType(config)(release),
        getCredits(config)(release)
      ])

      release.body = render(release, config)
    },
    description
  )
)
