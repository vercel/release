// Packages
const capitalize = require('capitalize')
const stripWhitespace = require('trim')

// Ours
const typeDefined = require('./type')

module.exports = (title, changeTypes) => {
  const definition = typeDefined(title, changeTypes)

  // If commit title contains the change type definition,
  // we need to hide it in the changelog
  if (definition) {
    title = title.replace('(' + definition + ')', '')
  }

  // Capitalize and remove trailing whitespace
  return stripWhitespace(capitalize(title))
}
