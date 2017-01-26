'use strict'

// Ours
const {tap} = require('../promise')

module.exports = ({progress, overwrite}) => tap(async release => {
  await release.load().then(
    ...progress.add(`Loading existing release for ${release.tagName}`)
  )

  if (!release.id) {
    progress.info(`No existing release for ${release.tagName}`)
    return
  }

  if (overwrite) {
    progress.info(`A release for ${release.tagName} already exists`)
    return
  }

  progress.info('Opening release in browser')
  release.open()

  throw new Error(`Release already exists:
    - delete the existing release;
    - or run "release --overwrite"
  `)
})
