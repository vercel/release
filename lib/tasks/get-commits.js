'use strict'

// Packages
const semVer = require('semver')

// Ours
const cleanTitle = require('../clean-title')
const definitions = require('../definitions')
const getCommits = require('../commits')

function skipReleaseTag(commit) {
  const isReleaseTag = semVer.valid(commit.title) !== null

  return isReleaseTag ? undefined : commit
}

function messageParser({changeTypes}) {
  return commit => {
    const defTitle = definitions.type(commit.title, changeTypes)
    const defDescription = definitions.type(commit.description, changeTypes)
    const definition = defTitle || defDescription

    if (definition) {
      const {content: title} = cleanTitle(commit.title, changeTypes)

      commit.title = title
      commit.definition = definition
    }

    return commit
  }
}

module.exports = async function ({tag, changeTypes, mapper = messageParser({changeTypes})}) {
  const commits = await getCommits({
    rev: tag.range,
    mapper: [skipReleaseTag].concat(mapper)
  })

  if (commits.length < 1) {
    throw new Error('No changes to release!')
  }

  return commits.reverse()
}

module.exports.messageParser = messageParser
module.exports.skipReleaseTag = skipReleaseTag
