'use strict'

// Packages
const taggedVersions = require('tagged-versions')

const RELEASE_INDEX = 0
const PREVIOUS_INDEX = 1

module.exports = {

  /**
   * Set `release.tags` to the infered release tag name and hash, and the
   * previous release tag.
   *
   * Assume the latest tag is the tag to release.
   *
   * if the tags are already set and valid, it will extends the array with a
   * `release` and `previous` properties pointing
   *
   * @param  {{tags: ?Array<{version: string, tags: string, hash: string}>}} release Release definition
   */
  async handler(release) {
    release.tags = await getTags(release)

    if (release.tags.length < 1) {
      throw new Error('No tags available for release.')
    }

    if (release.tags.length < 2) {
      throw new Error('The first release should be created manually.')
    }

    Object.defineProperties(release.tags, {
      release: alias(RELEASE_INDEX),
      previous: alias(PREVIOUS_INDEX)
    })
  }

}

async function getTags({tags}) {
  if (
    tags &&
    validTag(tags[RELEASE_INDEX]) &&
    validTag(tags[PREVIOUS_INDEX])
  ) {
    return tags
  }

  const allTags = await taggedVersions.getList().catch(
    () => new Error('Directory is not a Git repository.')
  )

  return allTags.slice(0, 2)
}

function validTag(tag) {
  return tag && tag.tag && tag.version && tag.hash
}

function alias(index) {
  return {
    configurable: true,
    enumerable: true,

    get() {
      return this[index]
    },

    set(tag) {
      if (!validTag(tag)) {
        throw new Error(`Invalid tag: ${tag}`)
      }

      this[index] = tag

      return tag
    }
  }
}
