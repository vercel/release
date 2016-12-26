// Packages
const isURL = require('is-url')
const parseRepo = require('github-url-to-object')
const git = require('git-state')

// Ours
const handleSpinner = require('./spinner')

exports.parseRepo = field => {
  if (typeof field === 'string') {
    if (isURL(field)) {
      return parseRepo(field)
    }

    return parseRepo(`github:${field}`)
  }

  if (field.url) {
    return parseRepo(field.url)
  }

  handleSpinner.fail('Could not determine GitHub repository.')
}

exports.branchSynced = async () => new Promise(resolve => {
  const path = process.cwd()

  git.isGit(path, exists => {
    if (!exists) {
      return
    }

    git.check(path, (err, results) => {
      if (err) {
        resolve(false)
        return
      }

      delete results.branch

      for (const result in results) {
        if (results[result] > 0) {
          resolve(false)
          break
        }
      }

      resolve(true)
    })
  })
})
