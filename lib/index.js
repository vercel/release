// Packages
const chalk = require('chalk')

// Ours
const {getRepo} = require('../lib/repo')
const connect = require('../lib/connect')
const {tap} = require('../lib/promise')
const tasks = require('../lib/tasks')

module.exports = exports = async config => {
  const {pre = false, progress, changeTypes} = config
  const [tag, repo] = await Promise.all([
    tasks.latestTag(),
    getRepo(),
    tasks.inSync()
  ])

  const github = await connect()

  const release = await tasks.getRelease({tag, github, repo})
    .then(...progress.add('Checking if release already exists'))

  await tasks.canRelease({release, config})

  const commits = await tasks.getCommits({
    tag,
    changeTypes
  }).then(...progress.add('Loading commit history'))

  await tasks.promptTypes({tag, commits, changeTypes, progress})

  const changelog = await tasks.renderChanges({tag, commits, changeTypes, repo, github})
    .then(...progress.add('Generating the changelog'))

  const publishedRelease = await tasks.publish({
    tag,
    github,
    changelog,
    repo,
    release,
    prerelease: pre}
  ).then(...progress.add(`Uploading ${pre ? 'pre' : ''}release`))

  progress.log(`\n${chalk.bold('Done!')} 🎉 Opening release in browser...`)

  return tasks.openRelease({release: publishedRelease, edit: true})
}

Object.assign(exports, tasks, {tap})
