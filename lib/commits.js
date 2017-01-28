// Native
const path = require('path')

// Packages
const getStream = require('get-stream')
const gitCommits = require('git-commits')
const through = require('through2')

// Ours
const promise = require('./promise')

function transformer(mapper) {
  return through.obj(
    (commit, enc, callback) => {
      promise.try(mapper, commit)
        .then(val => callback(null, val === null ? undefined : val))
        .catch(callback)
    }
  )
}

module.exports = async (opts = {}) => {
  const {
    gitDir = path.join(process.cwd(), '.git'),
    mapper = [],
    rev = 'HEAD'
  } = opts
  let stream = gitCommits(gitDir, {rev})

  for (const fn of [].concat(mapper)) {
    stream = stream.pipe(transformer(fn))
  }

  return getStream.array(stream)
}
