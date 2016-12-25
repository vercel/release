// Packages
const inquirer = require('inquirer')

module.exports = changeTypes => {
  const list = []

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
