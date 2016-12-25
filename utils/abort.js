// Packages
const {red} = require('chalk')

module.exports = message => {
  console.error(`${red('Error!')} ${message}`)
  process.exit(1)
}
