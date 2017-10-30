// Utilities
const cleanCommitTitle = require('./clean-title')
const { forPullRequest } = require('./credits')

module.exports = async ({ hash, message }, all, changeTypes) => {
  const title = cleanCommitTitle(message, changeTypes)
  let credits = []

  if (title.ref) {
    hash = title.ref

    const rawHash = hash.split('#')[1]

    // Retrieve users that have collaborated on a change
    const collaborators = await forPullRequest(rawHash)

    if (collaborators) {
      credits = credits.concat(collaborators)
    }
  }

  return {
    text: `- ${title.content}: ${hash}\n`,
    credits
  }
}
