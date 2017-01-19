'use strict'

// Packages
const open = require('open')

// Ours
const {tap} = require('../promise')

const getReleaseURL = (release, edit = false) => {
  if (!release || !release.html_url) {
    return false
  }

  const htmlURL = release.html_url
  return edit ? htmlURL.replace('/tag/', '/edit/') : htmlURL
}

module.exports = tap(({release, edit = false}) => {
  const releaseURL = getReleaseURL(release, edit)

  if (releaseURL) {
    open(releaseURL)
  }
})
