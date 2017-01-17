'use strict'

// Native
const fs = require('fs')
const path = require('path')

// Packages
const camelCase = require('lodash.camelcase')

function index() {
  const mods = {}
  const indexFile = path.basename(__filename)

  fs.readdirSync(__dirname).forEach(file => {
    if (
      path.extname(file) !== '.js' ||
      file === indexFile
    ) {
      return
    }

    const name = camelCase(file.slice(0, -3))

    mods[name] = Object.assign(
      {name},
      require(path.join(__dirname, file))
    )
  })

  return mods
}

module.exports = index()
