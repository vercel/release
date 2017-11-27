// Native
const path = require('path')

// Packages
const fs = require('fs-extra')
const semver = require('semver')
const { bold } = require('chalk')

// Utilities
const { fail, create: createSpinner, succeed } = require('./spinner')

const increment = async (type, preSuffix) => {
  const pkgPath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`The "package.json" file doesn't exist.`)
  }

  let pkgContent

  try {
    pkgContent = await fs.readJSON(pkgPath)
  } catch (err) {
    throw new Error(`Couldn't parse "package.json".`)
  }

  if (!pkgContent.version) {
    throw new Error(`No "version" field inside "package.json".`)
  }

  const { version: oldVersion } = pkgContent
  const isPre = semver.prerelease(oldVersion)
  const shouldBePre = type === 'pre'

  if (!isPre && shouldBePre && !preSuffix) {
    const canBe = semver.inc(oldVersion, type, 'canary')

    throw new Error(
      `The current tag (${bold(oldVersion)}) is not a pre-release tag. ` +
        `However, you can run ${bold(
          '`release pre <suffix>`'
        )} to convert it to one. ` +
        `\n\nAs an example, ${bold('`release pre canary`')} will ` +
        `increment it to ${bold(canBe)} – that easy!` +
        `\n\nAfter that's been done once, you can keep running ${bold(
          '`release pre`'
        )}.`
    )
  }

  let newVersion

  if (shouldBePre && preSuffix) {
    newVersion = semver.inc(oldVersion, type, preSuffix)
  } else {
    newVersion = semver.inc(oldVersion, type)
  }

  pkgContent.version = newVersion

  try {
    await fs.writeJSON(pkgPath, pkgContent, {
      spaces: 2
    })
  } catch (err) {
    throw new Error(`Couldn't write to "package.json".`)
  }

  const lockfilePath = path.join(process.cwd(), 'package-lock.json')

  if (!fs.existsSync(lockfilePath)) {
    return newVersion
  }

  let lockfileContent

  try {
    lockfileContent = await fs.readJSON(lockfilePath)
  } catch (err) {
    throw new Error(`Couldn't parse "package-lock.json".`)
  }

  lockfileContent.version = newVersion

  try {
    await fs.writeJSON(lockfilePath, lockfileContent, {
      spaces: 2
    })
  } catch (err) {
    throw new Error(`Couldn't write to "package-lock.json".`)
  }

  return newVersion
}

module.exports = async (type, preSuffix) => {
  let version
  createSpinner('Bumping version tag')

  try {
    version = await increment(type, preSuffix)
  } catch (err) {
    fail(err.message)
  }

  succeed(`Bumped version tag to ${version}`)
}
