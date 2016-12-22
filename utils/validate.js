// Native
const path = require('path')
const {existsSync} = require('fs')

// Utilities
const abort = require('./abort')

const isRepo = () => {
  const directory = process.cwd()

  const gitPath = path.join(directory, '.git')
  const headPath = path.join(directory, 'HEAD')

  if (!existsSync(gitPath) && !existsSync(headPath)) {
    abort('Directory is a not a valid Git repository.')
  }
}

const checkType = releaseType => {
  if (!releaseType) {
    abort('Please define a release type (major, minor or patch).')
  }

  const releaseTypes = [
    'major',
    'minor',
    'patch'
  ]

  if (!releaseTypes.includes(releaseType)) {
    abort(`The release type "${releaseType}" is not valid.`)
  }
}

module.exports = sub => {
  // Make sure the release type is correct
  checkType(sub[0])

  // Check if it's a Git repository
  isRepo()
}
