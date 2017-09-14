// Packages
const getUsername = require('github-username')

// Utilities
const connect = require('./connect')
const repo = require('./repo')

const getPullRequest = async number => {
  const github = await connect()
  const repoDetails = await repo.getRepo(github)

  const response = await github.pullRequests.get({
    owner: repoDetails.user,
    repo: repoDetails.repo,
    number
  })

  return response.data
}

exports.forPullRequest = async number => {
  let data

  try {
    data = await getPullRequest(number)
  } catch (err) {
    return
  }

  if (data.user) {
    return [data.user.login]
  }

  return false
}

exports.getAuthor = async ({ author }) => {
  let username

  try {
    username = await getUsername(author.email)
  } catch (err) {
    return false
  }

  return username
}
