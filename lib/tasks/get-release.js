'use strict'

// Packages
const pify = require('pify')

module.exports = async function ({tag, github, repo: {user: owner, repo}}) {
  const releases = await pify(github.repos.getReleases)({
    owner,
    repo
  }).catch(
    () => Promise.reject(new Error(`Couldn't check if release exists.`))
  )

  return releases.find(release => release.tag_name === tag.tag)
}
