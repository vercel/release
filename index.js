#!/usr/bin/env node

// Packages
const args = require('args')
const {red} = require('chalk')

args.parse(process.argv)

const abort = msg => {
  console.error(`${red('Error!')} ${msg}`)
  process.exit(1)
}

abort('LOL')
