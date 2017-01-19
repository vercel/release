/**
 * `lastTag` task.
 *
 * @typedef {{tag: string, hash: string, version: string} Tag
 * @typedef {{tag: string, hash: string, version: string, previous: Tag, range: string, type: string} LatestTag
 */

'use strict'

const taggedVersions = require('tagged-versions')
const semVer = require('semver')

/**
 * Return the lastest tag, from the current branch by default.
 *
 * @param  {String} [options.rev]   Revision range to lookup tags from (HEAD by default)
 * @param  {Object} [options.range] Semantic version to filter tags with
 * @return {LatestTag}
 */
module.exports = async function ({rev = 'HEAD', range} = {}) {
  const [latest, previous] = await taggedVersions.getList({rev, range}).catch(
    () => Promise.reject(new Error('Directory is not a Git repository.'))
  )

  if (!latest) {
    throw new Error('No tag available for release.')
  }

  if (!previous) {
    throw new Error('The first release should be created manually.')
  }

  Object.defineProperties(latest, {

    previous: {
      value: previous
    },

    range: {
      get() {
        return `${this.previous.tag}..${this.hash}`
      }
    },

    type: {
      get() {
        return semVer.diff(this.version, this.previous.version)
      }
    }

  })

  return latest
}
