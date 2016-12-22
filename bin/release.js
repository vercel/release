#!/usr/bin/env node

// Packages
const args = require('args')

// Utilities
const abort = require('../utils/abort')

args.parse(process.argv)
const releaseType = args.sub[0]

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

console.log(releaseType)
