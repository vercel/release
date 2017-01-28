'use strict'

// Native
const pluralize = require('pluralize')

// Packages
const semVer = require('semver')

// Ours
const cleanTitle = require('../clean-title')
const definitions = require('../definitions')
const getCommits = require('../commits')
const promise = require('../promise')

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

module.exports = config => promise.tap(async release => {
  const {mapper = messageParser(config), progress} = config

  const commits = await getCommits({
    rev: release.range,
    mapper: [skipReleaseTag].concat(mapper)
  }).then(
    ...progress.add('Loading commit history')
  )

  if (commits.length < 1) {
    throw new Error('No changes to release!')
  }

  progress.info(`Loaded ${commits.length} ${pluralize('commit', commits.length)}`)

  release.commits = commits.reverse()
})

module.exports.messageParser = messageParser
module.exports.skipReleaseTag = skipReleaseTag
