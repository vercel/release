// Native
const queryString = require('query-string')

// Packages
const request = require('request-promise-native')
const open = require('open')
const randomString = require('random-string')

// Ours
const abort = require('./abort')

module.exports = () => {
  let authURL = 'https://github.com/login/oauth/authorize'

  const state = randomString({
    length: 20
  })

  const params = {
    client_id: '08bd4d4e3725ce1c0465',
    scope: 'repo',
    state
  }

  authURL += '?' + queryString.stringify(params)

  console.log(authURL)

  abort('test')
}
