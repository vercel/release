// Packages
const {red} = require('chalk')

module.exports = msg => {
  console.error(`${red('Error!')} ${msg}`)
  process.exit(1)
}
