// Packages
const inquirer = require('inquirer')

module.exports = (changeTypes, release) => {
  const list = []
  let notNeeded

  switch (release.type) {
    case 'minor':
      notNeeded = 1
      break
    case 'patch':
      notNeeded = 2
      break
    default:
      notNeeded = 0
  }

  if (notNeeded) {
    changeTypes.splice(0, notNeeded)
  }

  for (const type of changeTypes) {
    const short = type.handle

    list.push({
      name: `${type.name} (${type.description})`,
      value: short,
      short: '(' + short + ')'
    })
  }

  return list.concat([
    new inquirer.Separator(),
    {
      name: 'Ignore',
      short: '(ignored)',
      value: 'ignore'
    }
  ])
}
