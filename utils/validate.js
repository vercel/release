// Utilities
const abort = require('./abort')

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
}
