// Native
const path = require('path')

// Packages
const gitCommits = require('git-commits')

// Ours
const handleSpinner = require('./spinner')

module.exports = (rev = 'HEAD') => new Promise(resolve => {
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
