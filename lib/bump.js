// Native
const path = require('path')

// Packages
const fs = require('fs-extra')
const semver = require('semver')

// Utilities
const handleSpinner = require('./spinner')

const done = version => {
  const { spinner } = global
  const text = `Bumped version tag to ${version}`

  spinner.succeed(text)
}

module.exports = async type => {
  handleSpinner.create('Bumping version tag')

  const pkgPath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(pkgPath)) {
    handleSpinner.fail(`The "package.json" file doesn't exist.`)
  }

  let pkgContent

  try {
    pkgContent = await fs.readJSON(pkgPath)
  } catch (err) {
    handleSpinner.fail(`Couldn't parse "package.json".`)
  }

  if (!pkgContent.version) {
    handleSpinner.fail(`No "version" field inside "package.json".`)
  }

  const newVersion = semver.inc(pkgContent.version, type)
  pkgContent.version = newVersion

  try {
    await fs.writeJSON(pkgPath, pkgContent, {
      spaces: 2
    })
  } catch (err) {
    handleSpinner.fail(`Couldn't write to "package.json".`)
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
    handleSpinner.fail(`Couldn't parse "package-lock.json".`)
  }

  lockfileContent.version = newVersion

  try {
    await fs.writeJSON(lockfilePath, lockfileContent, {
      spaces: 2
    })
  } catch (err) {
    handleSpinner.fail(`Couldn't write to "package-lock.json".`)
  }

  done(newVersion)
}
