#!/usr/bin/env node

// Native
const path = require('path')
const {execSync} = require('child_process')

// Packages
const github = require('github')
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

if (!pkg.repository) {
  abort('No repository field inside the package.json file.')
}

let githubToken

try {
  githubToken = execSync('security find-internet-password -s github.dcom -g -w', {
    stdio: [
      'ignore',
      'pipe',
      'ignore'
    ]
  })
} catch (err) {
  abort('Could not find GitHub token in Keychain.')
}


console.log(String(githubToken))
