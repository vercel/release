// Utilities
const abort = require('./abort')

module.exports = releaseType => {
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
