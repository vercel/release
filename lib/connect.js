// Native
const queryString = require('querystring')

// Packages
const request = require('request-promise-native')
const open = require('open')
const randomString = require('random-string')
const retry = require('async-retry')
const Storage = require('configstore')
const GitHubAPI = require('@octokit/rest')
const sleep = require('then-sleep')

// Utilities
const pkg = require('../package')
const handleSpinner = require('./spinner')

// Initialize token storage
const config = new Storage(pkg.name)

const github = new GitHubAPI({
  protocol: 'https',
  headers: {
    'user-agent': `Release v${pkg.version}`
  }
})

const tokenAPI = state =>
  retry(
    () =>
      new Promise((resolve, reject) => {
        request({
          uri: 'https://release-auth.zeit.sh',
          qs: {
            state
          },
          json: true
        })
          .then(res => {
            if (res.status === 403) {
              reject(new Error('Unauthorized'))
            }

            if (res.error) {
              reject(res.error)
            }

            resolve(res.token)
          })
          .catch(reject)
      }),
    {
      retries: 500
    }
  )

const validateToken = token =>
  new Promise(resolve => {
    github.authenticate({
      type: 'token',
      token
    })

    // See if the token works by getting
    // the data for our company's account
    github.users.getForUser(
      {
        username: 'zeit'
      },
      err => {
        if (err) {
          resolve(false)
          return
        }

        resolve(true)
      }
    )
  })

const loadToken = async () => {
  if (config.has('token')) {
    const fromStore = config.get('token')
    const valid = await validateToken(fromStore)

    return valid ? fromStore : false
  }

  return false
}

const requestToken = async () => {
  let authURL = 'https://github.com/login/oauth/authorize'

  const state = randomString({
    length: 20
  })

  const params = {
    // eslint-disable-next-line camelcase
    client_id: '08bd4d4e3725ce1c0465',
    scope: 'repo',
    state
  }

  authURL += '?' + queryString.stringify(params)
  open(authURL)

  const token = await tokenAPI(state)
  config.set('token', token)

  return token
}

module.exports = async () => {
  let token = await loadToken()

  if (!token) {
    handleSpinner.create('Opening GitHub authentication page')
    await sleep(100)

    try {
      token = await requestToken()
    } catch (err) {
      handleSpinner.fail("Couldn't load token.")
    }
  }

  github.authenticate({
    type: 'token',
    token
  })

  return github
}
