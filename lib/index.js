// Packages
const args = require('args')
const chalk = require('chalk')
const taggedVersions = require('tagged-versions')

// Ours
const {getRepo} = require('../lib/repo')
const definitions = require('../lib/definitions')
const connect = require('../lib/connect')
const handleSpinner = require('../lib/spinner')
const {tap} = require('../lib/promise')
const tasks = require('../lib/tasks')
const cleanTitle = require('../lib/clean-title')

args
  .option('pre', 'Mark the release as prerelease')
  .option('overwrite', 'If the release already exists, replace it')

const flags = args.parse(process.argv)

const changeTypes = [
  {
    handle: 'major',
    name: 'Major Change',
    description: 'incompatible API change'
  },
  {
    handle: 'minor',
    name: 'Minor Change',
    description: 'backwards-compatible functionality'
  },
  {
    handle: 'patch',
    name: 'Patch',
    description: 'backwards-compatible bug fix'
  }
]

function messageParser(commit) {
  const defTitle = definitions.type(commit.title, changeTypes)
  const defDescription = definitions.type(commit.description, changeTypes)
  const definition = defTitle || defDescription

  if (definition) {
    const {content: title} = cleanTitle(commit.title, changeTypes)

    commit.title = title
    commit.definition = definition
  }

  return commit
}

module.exports = exports = async () => {
  const [tag, repo] = await Promise.all([
    tasks.latestTag(),
    getRepo(),
    tasks.inSync()
  ])

  const github = await connect()

  handleSpinner.create('Checking if release already exists')

  const release = await tasks.getRelease({tag, github, repo})

  global.spinner.succeed()

  await tasks.canRelease({release, flags})

  handleSpinner.create('Loading commit history')

  const commits = await tasks.getCommits({
    tag,
    mapper: messageParser
  })

  global.spinner.succeed()

  await tasks.promptTypes({tag, commits, changeTypes})

  handleSpinner.create('Generating the changelog')

  const changelog = await tasks.renderChanges({tag, commits, changeTypes, repo, github})

  global.spinner.succeed()

  handleSpinner.create(`Uploading ${args.pre ? 'pre' : ''}release`)

  const publishedRelease = await tasks.publish({
    tag,
    github,
    changelog,
    repo,
    release,
    prerelease: args.pre})

  global.spinner.succeed()
  console.log(`\n${chalk.bold('Done!')} 🎉 Opening release in browser...`)

  return tasks.openRelease({release: publishedRelease, edit: true})
}

Object.assign(exports, tasks, {tap, messageParser})
