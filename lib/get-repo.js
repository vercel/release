// Packages
const isURL = require('is-url')
const parseRepo = require('github-url-to-object')

// Ours
const abort = require('./abort')

module.exports = field => {
  if (typeof field === 'string') {
    if (isURL(field)) {
      return parseRepo(field)
    }

    return parseRepo(`github:${field}`)
  }

  if (field.url) {
    return parseRepo(field.url)
  }

  abort('Could not determine GitHub repository.')
}
