// Packages
const capitalize = require('capitalize')
const stripWhitespace = require('trim')

// Ours
const definitions = require('./definitions')

module.exports = (title, changeTypes) => {
  const typeDefinition = definitions.type(title, changeTypes)
  const refDefinition = definitions.reference(title)

  // If commit title contains the change type definition,
  // we need to hide it in the changelog
  if (typeDefinition) {
    title = title.replace('(' + typeDefinition + ')', '')
  }

  if (refDefinition) {
    title = title.replace(' (' + refDefinition + ')', '')
  }

  return {
    content: stripWhitespace(capitalize(title)),
    ref: refDefinition
  }
}
