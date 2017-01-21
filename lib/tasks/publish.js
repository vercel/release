'use strict'

module.exports = async function (options) {
  const {
    tag,
    github,
    changelog,
    repo: {user: owner, repo},
    release: {id} = {},
    prerelease = false
  } = options

  const payload = {
    owner,
    repo,
    prerelease,
    tag_name: tag.tag,
    target_commitish: tag.hash,
    body: changelog,
    draft: true
  }

  if (id) {
    payload.id = id
  }

  const method = `${id ? 'edit' : 'create'}Release`

  return github.repos[method](payload).catch(
    () => Promise.reject(new Error('Failed to upload release.'))
  )
}
