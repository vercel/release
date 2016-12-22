#!/usr/bin/env node

// Packages
const args = require('args')
const {red} = require('chalk')

args.parse(process.argv)
const releaseType = args.sub[0]

const abort = msg => {
  console.error(`${red('Error!')} ${msg}`)
  process.exit(1)
}

if (!releaseType) {
  abort('Please define a release type (major, minor or patch)!')
}

console.log(releaseType)
