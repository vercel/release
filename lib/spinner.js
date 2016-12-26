// Packages
const ora = require('ora')

// Ours
const abort = require('./abort')

exports.create = message => {
  if (global.spinner) {
    global.spinner.succeed()
  }

  global.spinner = ora(message).start()
}

exports.fail = message => {
  if (global.spinner) {
    global.spinner.fail()
  }

  console.log('')
  abort(message)
}
