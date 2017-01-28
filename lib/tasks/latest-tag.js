/**
 * `lastTag` task.
 *
 * @typedef {{tag: string, hash: string, version: string} Tag
 * @typedef {{tag: string, hash: string, version: string, previous: Tag, range: string, type: string} LatestTag
 */

'use strict'

// Packages
const taggedVersions = require('tagged-versions')

// Ours
const {tap} = require('../promise')

/**
 * Return the lastest tag, from the current branch by default.
 *
 * @param  {String} [options.rev]   Revision range to lookup tags from (HEAD by default)
 * @return {function(Release): Promise<Release,Error>}
 */
module.exports = ({rev = 'HEAD'} = {}) => tap(async release => {
  const [target, previous] = await taggedVersions.getList({rev}).catch(
    () => Promise.reject(new Error('Directory is not a Git repository.'))
  )

  if (!target) {
    throw new Error('No tag available for release.')
  }

  if (!previous) {
    throw new Error('The first release should be created manually.')
  }

  release.target = target
  release.previous = previous
})
