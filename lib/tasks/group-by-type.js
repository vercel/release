'use strict'

// ours
const {tap} = require('../promise')

module.exports = ({changeTypes}) => tap(async release => {
  const byTypes = changeTypes.reduce(
    (result, type) => Object.assign(
      result, {[type.handle]: Object.assign({commits: []}, type)}
    ),
    {}
  )

  for (const commit of release.commits) {
    const group = byTypes[commit.definition]

    if (group) {
      group.commits.push(commit)
    }
  }

  release.changes = changeTypes
    .map(type => byTypes[type.handle])
    .filter(group => group.commits.length > 0)
})
