// Native
const path = require('path')

// Packages
const fs = require('fs-extra')
const semver = require('semver')

// Utilities
const handleSpinner = require('./spinner')

// Check if running in a terminal or piping
const { isTTY } = process.stdout

const done = version => {
  if (!isTTY) {
    process.stdout.write(version)
    return
  }

  const { spinner } = global
  const text = `Bumped version tag to ${version}`

  spinner.succeed(text)
}

const fail = message => {
  if (!isTTY) {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  }

  handleSpinner.fail(message)
}

module.exports = async type => {
  if (isTTY) {
    handleSpinner.create('Bumping version tag')
  }

  const pkgPath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(pkgPath)) {
    fail(`The "package.json" file doesn't exist.`)
  }

  let pkgContent

  try {
    pkgContent = await fs.readJSON(pkgPath)
  } catch (err) {
    fail(`Couldn't parse "package.json".`)
  }

  if (!pkgContent.version) {
    fail(`No "version" field inside "package.json".`)
  }

  const newVersion = semver.inc(pkgContent.version, type)
  pkgContent.version = newVersion

  try {
    await fs.writeJSON(pkgPath, pkgContent, {
      spaces: 2
    })
  } catch (err) {
    fail(`Couldn't write to "package.json".`)
  }

  const lockfilePath = path.join(process.cwd(), 'package-lock.json')

  if (!fs.existsSync(lockfilePath)) {
    done(newVersion)
    return
  }

  let lockfileContent

  try {
    lockfileContent = await fs.readJSON(lockfilePath)
  } catch (err) {
    fail(`Couldn't parse "package-lock.json".`)
  }

  lockfileContent.version = newVersion

  try {
    await fs.writeJSON(lockfilePath, lockfileContent, {
      spaces: 2
    })
  } catch (err) {
    fail(`Couldn't write to "package-lock.json".`)
  }

  done(newVersion)
}
