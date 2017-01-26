'use strict'

// Packages
const chalk = require('chalk')
const inquirer = require('inquirer')

// Ours
const getChoices = require('../choices')
const {tap} = require('../promise')

module.exports = ({changeTypes, progress}) => tap(async release => {
  const choices = getChoices(changeTypes, release)
  const incomplete = release.commits.filter(commit => !commit.definition)
  const questions = incomplete.map(
    (commit, index) => ({
      choices,
      name: index.toString(),
      message: commit.title,
      type: 'list'
    })
  )

  progress.log(`\n${chalk.green('!')} Please enter the type of change for each commit:\n`)
  progress.pause()

  const answers = inquirer.prompt(questions)

  answers.ui.process.subscribe(question => {
    incomplete[question.name].definition = question.answer
  })

  await answers

  progress.log('').restart()
})
