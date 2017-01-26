'use strict'

// Packages
const chalk = require('chalk')

// Ours
const {tap} = require('../promise')

module.exports = ({progress, pre}) => tap(async release => {
  const description = `Uploading ${pre ? 'pre' : ''}release ${release.tagName}`

  await release.save()
    .then(...progress.add(description))
    .catch(() => Promise.reject(new Error('Failed to upload release.')))

  release.open({edit: true})
  progress.log(`${chalk.bold('Done!')} 🎉 Opening release in browser...`)
})
