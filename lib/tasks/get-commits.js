'use strict'

// Native
const path = require('path')

// Packages
const getStream = require('get-stream')
const gitCommits = require('git-commits')
const semVer = require('semver')
const through = require('through2')

function skipReleaseTag(commit) {
  const isReleaseTag = semVer.valid(commit.title) !== null

  return isReleaseTag ? undefined : commit
}

function transformer(mapper) {
  return through.obj(
    (commit, enc, callback) => Promise.resolve(mapper(commit))
      .then(val => callback(null, val === null ? undefined : val))
      .catch(callback)
  )
}

module.exports = async function ({tag, mapper} = {}) {
  const mappers = [skipReleaseTag].concat(mapper)
  const repoPath = path.join(process.cwd(), '.git')
  let stream = gitCommits(repoPath, {rev: tag.range})

  for (const fn of mappers) {
    stream = stream.pipe(transformer(fn))
  }

  const commits = await getStream.array(stream)

  if (commits.length < 1) {
    throw new Error('No changes happened since the last release.')
  }

  return commits
}
