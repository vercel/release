// Ours
const cleanCommitTitle = require('./clean-title')

module.exports = (hash, all, changeTypes) => {
  const related = all.filter(item => {
    return item.hash === hash
  })[0]

  const title = cleanCommitTitle(related.title, changeTypes)

  if (title.ref) {
    hash = title.ref
  }

  return `- ${title.content}: ${hash}\n`
}
