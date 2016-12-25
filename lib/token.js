// Native
const {execSync} = require('child_process')

// Packages
const stripWhitespace = require('trim')

// Ours
const abort = require('./abort')

module.exports = () => {
  const cmd = 'security find-internet-password -s github.com -g -w'
  let token

  try {
    token = execSync(cmd, {
      stdio: [
        'ignore',
        'pipe',
        'ignore'
      ]
    })
  } catch (err) {
    abort('Could not find GitHub token in Keychain.')
  }

  return stripWhitespace(String(token))
}
