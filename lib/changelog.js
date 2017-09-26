// Packages
const { plural } = require('pluralize')
const stripWhitespace = require('trim')

// Utilities
const pickCommit = require('./pick-commit')
const { getAuthor } = require('./credits')

module.exports = async (types, commits, changeTypes) => {
  let text = ''
  const credits = new Set()

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
      const changeDetails = await pickCommit(change, commits.all, changeTypes)

      if (changeDetails.text) {
        text += changeDetails.text
      }

      if (changeDetails.credits && changeDetails.credits.length > 0) {
        changeDetails.credits.forEach(item => {
          // Don't add bots to the credits
          if (item.includes('[bot]')) {
            return
          }

          credits.add(item)
        })
      }

      if (change === lastChange) {
        text += '\n'
      }
    }
  }

  const username = await getAuthor(commits.latest)

  // Don't include the release author in the credits
  if (username && credits.has(username)) {
    credits.delete(username)
  }

  if (credits.size > 0) {
    text += '### Credits \n\n'
    text += 'Huge thanks to '

    // GitHub links usernames if prefixed with @
    let index = 1
    credits.forEach(credit => {
      text += `@${credit}`

      const penultimate = index === credits.size - 1
      const notLast = index !== credits.size

      if (penultimate) {
        text += ' and '
      } else if (notLast) {
        text += ', '
      }

      index += 1
    })

    text += ' for their help!'
    text += '\n'
  }

  // Remove newlines from the end
  return {
    changelog: stripWhitespace.right(text),
    credits
  }
}
