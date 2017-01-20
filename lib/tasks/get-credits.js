'use strict'

async function getLogins({repo, user: owner}, sha, github) {
  const commit = await github.repos.getCommit({repo, owner, sha})
    .catch(() => {})

  if (!commit) {
    return []
  }

  return [commit.author.login, commit.committer.login]
}

module.exports = async function ({repo, commits, github}) {
  const contributors = {}

  for (const commit of commits) {
    for (const user of [commit.author, commit.committer]) {
      contributors[user.email] = commit.hash
    }
  }

  const logins = await Promise.all(
    Object.keys(contributors)
      .map(k => contributors[k])
      .map(hash => getLogins(repo, hash, github)
  ))

  return Array.from(new Set([].concat.apply([], logins)))
}
