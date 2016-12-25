// Packages
const {plural} = require('pluralize')
const stripWhitespace = require('trim')

// Ours
const pickCommit = require('./pick-commit')

module.exports = (types, commits, changeTypes) => {
  let text = ''

  for (const type in types) {
    if (!{}.hasOwnProperty.call(types, type)) {
      continue
    }

    const changes = types[type]

    if (changes.length < 1) {
      continue
    }

    const typeInfo = changeTypes.filter(item => {
      return item.handle === type
    })[0]

    // Add heading
    text += `### ${plural(typeInfo.name)} \n\n`

    // Find last change, in order to be able
    // to add a newline after it
    const lastChange = changes[changes.length - 1]

    for (const change of changes) {
      text += pickCommit(change, commits, changeTypes)

      if (change === lastChange) {
        text += '\n'
      }
    }
  }

  // Remove newlines from the end
  return stripWhitespace.right(text)
}
