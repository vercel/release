// Packages
const {plural} = require('pluralize')
const stripWhitespace = require('trim')

// Ours
const pickCommit = require('./pick-commit')

module.exports = (types, commits, changeTypes) => {
  let text = ''
  let credits = []

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
      const changeDetails = pickCommit(change, commits, changeTypes)

      if (changeDetails.text) {
        text += changeDetails.text
      }

      if (changeDetails.credits && changeDetails.credits.length > 0) {
        credits = credits.concat(changeDetails.credits)
      }

      if (change === lastChange) {
        text += '\n'
      }
    }
  }

  if (credits.length > 0) {
    text += '\n'
    text += '### Huge Thanks To ... \n\n'

    for (const credit of credits) {
      text += `@${credit}`
    }

    text += '\n'
  }

  // Remove newlines from the end
  return stripWhitespace.right(text)
}
