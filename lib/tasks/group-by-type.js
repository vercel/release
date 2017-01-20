'use strict'

module.exports = async function ({commits, changeTypes}) {
  const byTypes = changeTypes.reduce(
    (result, type) => Object.assign(
      result, {[type.handle]: Object.assign({commits: []}, type)}
    ),
    {}
  )

  for (const commit of commits) {
    const group = byTypes[commit.definition]

    if (group) {
      group.commits.push(commit)
    }
  }

  return changeTypes
    .map(type => byTypes[type.handle])
    .filter(group => group.commits.length > 0)
}
