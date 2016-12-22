#!/usr/bin/env node

// Native
const path = require('path')

// Packages
const args = require('args')
const {red} = require('chalk')

args.parse(process.argv)

const abort = msg => {
  console.error(`${red('Error!')} ${msg}`)
  process.exit(1)
}

const pkgPath = path.join(process.cwd(), 'package.json')
let pkg

try {
  pkg = require(pkgPath)
} catch (err) {
  abort('Could not find a package.json file.')
}


console.log(pkg)
abort('Ddd')
