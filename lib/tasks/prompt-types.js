'use strict'

// Packages
const chalk = require('chalk')
const inquirer = require('inquirer')

// Ours
const getChoices = require('../choices')

module.exports = async function ({tag, commits, changeTypes, progress}) {
  const choices = getChoices(changeTypes, tag)
  const incomplete = commits.filter(commit => !commit.definition)
  const questions = incomplete.map(
    (commit, index) => ({
      choices,
      name: index.toString(),
      message: commit.title,
      type: 'list'
    })
  )

  progress.log(`${chalk.green('!')} Please enter the type of change for each commit:\n`)

  const answers = inquirer.prompt(questions)

  answers.ui.process.subscribe(question => {
    incomplete[question.name].definition = question.answer
  })

  return answers.then(() => commits)
}
