// Native
const queryString = require('querystring')

// Packages
const request = require('request-promise-native')
const open = require('open')
const randomString = require('random-string')
const retry = require('async-retry').default
const Storage = require('configstore')
const GitHubAPI = require('github')
const sleep = require('then-sleep')

// Ours
const pkg = require('../package')

// Initialize token storage
const config = new Storage(pkg.name)

const github = new GitHubAPI({
  protocol: 'https',
  headers: {
    'user-agent': `Release v${pkg.version}`
  }
})

const tokenAPI = async state => await retry(async bail => {
  const res = await request({
    uri: 'https://release-auth.now.sh',
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

const validateToken = async token => new Promise(resolve => {
  github.authenticate({
    type: 'token',
    token
  })

  // See if the token works by getting
  // the data for our company's account
  github.users.getForUser({
    username: 'zeit'
  }, err => {
    if (err) {
      resolve(false)
      return
    }

    resolve(true)
  })
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

module.exports = async progress => {
  let token = await loadToken()

  if (!token) {
    await sleep(100)
    token = await requestToken()
      .then(...progress.add('Opening GitHub authentication page...'))
  }

  await github.authenticate({
    type: 'token',
    token
  })

  return github
}
