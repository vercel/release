'use strict'

// Packages
const childProcess = require('child-process-promise')
const semver = require('semver')
const taggedVersions = require('tagged-versions')

const HASH_REGEX = /^[0-9a-f]{7,40}$/

/**
 * Superset tagged-versions tag object with a hasPrefix property.
 */
class Tag {

  constructor({version, hash, hasPrefix = false, date = null}) {
    if (!version || !semver.valid(version)) {
      throw new Error(`"${version}" is not a semantic version.`)
    }

    if (!hash || !HASH_REGEX.test(hash)) {
      throw new Error(`"${hash}" is an invalid sha1 hash`)
    }

    this.version = version
    this.date = date
    this.hash = hash
    this.hasPrefix = hasPrefix
  }

  get tag() {
    const version = semver.clean(this.version)

    return this.hasPrefix ? `v${version}` : version
  }

  /**
   * Create a tag from either a Tag or a tagged-versions object.
   *
   * @param  {string}  options.tag    tag name
   * @param  {string}  options.hash   commit hash
   * @param  {Date}    options.date   commit date
   * @param  {boolean} options.hasPrefix tag has a hasPrefix
   * @return {Tag}
   */
  static from({version, hasPrefix, hash, date, tag}) {
    if (tag) {
      return new Tag({
        hash,
        date,
        version: semver.clean(tag),
        hasPrefix: tag.startsWith('v')
      })
    }

    return new Tag({version, hasPrefix, hash, date})
  }

}

exports.from = Tag.from

/**
 * Return the tags for the upcomming release and and the previous one.
 *
 * @param  {string} version Exact ver
 * @return {Array<Tag>}
 */
exports.range = async function (version) {
  if (!semver.valid(version)) {
    throw new Error(`Invalid version: ${version}`)
  }

  const semRange = `<=${semver.clean(version)}`
  const [hash, [first, second]] = await Promise.all([
    getHeadHash(),
    taggedVersions.getList(semRange)
  ]).catch(
    () => Promise.reject(new Error('Directory is not a Git repository.'))
  )
  const releaseIsTagged = Boolean(first) && first.version === version

  if (!first || (releaseIsTagged && !second)) {
    throw new Error('No initial release: the first release should be created manually.')
  }

  if (releaseIsTagged) {
    return [Tag.from(first), Tag.from(second)]
  }

  const parent = Tag.from(first)
  const release = Tag.from({version, hash, hasPrefix: parent.hasPrefix})

  return [release, parent]
}

/**
 * Query the local repo hash of HEAD.
 *
 * @return {string}
 */
async function getHeadHash() {
  return childProcess.exec('git rev-parse HEAD').then(
    result => result.stdout.trim()
  )
}
