'use strict'

// Ours
const groupByType = require('./group-by-type')
const getCredits = require('./get-credits')
const {render} = require('../changelog')

async function getContext(options) {
  if (options.changes && options.credits) {
    const {tag, changes, credits, commits} = options

    return {tag, changes, credits, commits}
  }

  const {tag, commits, changeTypes, repo, github} = options
  const loadChanges = options.changes || groupByType({commits, changeTypes})
  const loadCredits = options.credits || getCredits({repo, commits, github})
  const [changes, credits] = await Promise.all([loadChanges, loadCredits])

  return {tag, commits, changes, credits}
}

module.exports = async function (options) {
  const context = await getContext(options)

  return render(context, options)
}
