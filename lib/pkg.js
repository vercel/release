'use strict'

// Native
const fs = require('fs')

exports.read = function () {
  return readFile('./package.json', 'utf8').then(
    json => JSON.parse(json)
  ).catch(
    err => Promise.reject(new Error(`Failed to package.json: ${err}`))
  )
}

function readFile(fileName, option) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, option, (err, content) => {
      if (err) {
        reject(err)
      } else {
        resolve(content)
      }
    })
  })
}
