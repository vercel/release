// Packages
const git = require('git-state')
const repoName = require('git-repo-name')
const repoUser = require('git-username')

// Ours
const handleSpinner = require('./spinner')

exports.getRepo = githubConnection =>
  new Promise(resolve => {
    repoName((err, repo) => {
      if (err) {
        handleSpinner.fail('Could not determine GitHub repository.')
        return
      }

      const details = { repo }

      // If a repo has been transfered, the owner of the repo won't be the current user but an
      // organization. By getting the repo, we can get the proper repo's owner, since repos.get
      // handle the transfer, thing that repos.createRelease does not.
      githubConnection.repos.get(
        { owner: repoUser(), repo: details.repo },
        (err, detailedRepo) => {
          if (err) {
            handleSpinner.fail('Could not determine GitHub repository.')
            return
          }

          details.user = detailedRepo.data.owner.login

          resolve(details)
        }
      )
    })
  })

exports.branchSynced = () =>
  new Promise(resolve => {
    const path = process.cwd()

    const ignore = ['branch', 'stashes', 'untracked']

    git.isGit(path, exists => {
      if (!exists) {
        return
      }

      git.check(path, (err, results) => {
        if (err) {
          resolve(false)
          return
        }

        for (const state of ignore) {
          delete results[state]
        }

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
