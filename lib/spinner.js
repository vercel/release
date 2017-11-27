// Packages
const ora = require('ora')
const { red } = require('chalk')

exports.create = message => {
  exports.succeed()
  global.spinner = ora(message).start()
}

exports.fail = message => {
  if (global.spinner) {
    global.spinner.fail()
    console.log('')
  }

  console.error(`${red('Error!')} ${message}`)

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
}

exports.succeed = message => {
  if (!global.spinner) {
    return
  }

  global.spinner.succeed(message)
}
