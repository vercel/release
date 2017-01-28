'use strict'

// Ours
const {tap} = require('../promise')

async function getLogins({repo, owner, client}, sha) {
  const commit = await client.repos.getCommit({repo, owner, sha})
    .catch(() => {})

  if (!commit) {
    return []
  }

  return [commit.author.login, commit.committer.login]
}

module.exports = ({progress}) => {
  const handler = async release => {
    const contributors = {}

    for (const commit of release.commits) {
      for (const user of [commit.author, commit.committer]) {
        contributors[user.email] = commit.hash
      }
    }

    const logins = await Promise.all(
      Object.keys(contributors)
        .map(k => contributors[k])
        .map(hash => getLogins(release, hash)
    ))

    release.credits = Array.from(new Set([].concat.apply([], logins)))
  }

  return tap(progress.wrap(handler, 'Loading contributors'))
}
