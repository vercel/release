// Utilities
const connect = require('./connect')
const repo = require('./repo')

const getPullRequest = async number => {
  const repoDetails = await repo.getRepo()
  const github = await connect()

  const response = await github.pullRequests.get({
    owner: repoDetails.user,
    repo: repoDetails.repo,
    number
  })

  return response.data
}

module.exports = async number => {
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
