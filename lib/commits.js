// Native
const path = require('path')

// Packages
const gitCommits = require('git-commits')

// Ours
const handleSpinner = require('./spinner')

module.exports = tags => new Promise((resolve, reject) => {
  const [release, parent] = tags

  if (!release || !parent || !parent.hash || !release.hash) {
    reject(new Error('the first release should be created manually.'))
  }

  const rev = `${parent.hash}..${release.hash || 'HEAD'}`
  const repoPath = path.join(process.cwd(), '.git')
  const commits = []

  gitCommits(repoPath, {rev}).on('data', commit => {
    commits.push(commit)
  }).on('error', () => {
    handleSpinner.fail('Not able to collect commits.')
  }).on('end', () => {
    resolve(commits)
  })
})
