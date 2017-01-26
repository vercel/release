'use strict'

const {branchSynced} = require('../repo')
const {tap} = require('../promise')

/**
 * Pass-through promise to test if the current local branch is in sync
 *
 * @param  {any} value Any value the promise value will resolve to if the current local branch is in sync.
 * @return {any}
 */
module.exports = () => tap(async () => {
  const inSync = await branchSynced()

  if (!inSync) {
    throw new Error('Your branch needs to be up-to-date with origin.')
  }
})
