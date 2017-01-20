'use strict'

// Ours
const {tap} = require('../promise')
const open = require('./open-release')

module.exports = tap(async ({release, flags}) => {
  if (!release || flags.overwrite) {
    return
  }

  await open({release})

  throw new Error('Release already exists. Opening in browser...')
})
