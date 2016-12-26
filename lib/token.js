// Native
const queryString = require('query-string')

// Packages
const request = require('request-promise-native')
const open = require('open')
const randomString = require('random-string')
const retry = require('async-retry').default

const loadToken = async state => await retry(async bail => {
  const res = await request({
    uri: 'http://localhost:5000',
    qs: {
      state
    },
    json: true
  })

  if (res.status === 403) {
    bail(new Error('Unauthorized'))
  }

  if (res.error) {
    bail(res.error)
  }

  return res.token
}, {
  retries: 500
})

module.exports = async () => {
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
  open(authURL)

  return await loadToken(state)
}
