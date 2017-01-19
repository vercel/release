// Packages
const args = require('args')
const chalk = require('chalk')
const semVer = require('semver')
const inquirer = require('inquirer')
const taggedVersions = require('tagged-versions')

// Ours
const groupChanges = require('../lib/group')
const {getRepo} = require('../lib/repo')
const getCommits = require('../lib/commits')
const getChoices = require('../lib/choices')
const definitions = require('../lib/definitions')
const connect = require('../lib/connect')
const createChangelog = require('../lib/changelog')
const handleSpinner = require('../lib/spinner')
const {tap} = require('../lib/promise')
const tasks = require('../lib/tasks')

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

const createRelease = async (changelog, options) => {
  const {tag, github, repo: {user: owner, repo}, release: {id} = {}} = options
  const isPre = flags.pre ? 'pre' : ''
  handleSpinner.create(`Uploading ${isPre}release`)

  const methodPrefix = id ? 'edit' : 'create'
  const method = methodPrefix + 'Release'

  const body = {
    owner,
    repo,
    tag_name: tag.tag,
    target_commitish: tag.hash,
    body: changelog,
    draft: true,
    prerelease: flags.pre
  }

  if (id) {
    body.id = id
  }

  const release = await github.repos[method](body).catch(
    () => Promise.reject(new Error('Failed to upload release.'))
  )

  global.spinner.succeed()
  console.log(`\n${chalk.bold('Done!')} 🎉 Opening release in browser...`)

  tasks.openRelease({release, edit: true})
}

const orderCommits = (commits, options) => {
  const {tag} = options
  const questions = []
  const predefined = {}

  const choices = getChoices(changeTypes, tag)

  // Show the latest changes first
  commits.reverse()

  for (const commit of commits) {
    const defTitle = definitions.type(commit.title, changeTypes)
    const defDescription = definitions.type(commit.description, changeTypes)

    const definition = defTitle || defDescription

    if (definition) {
      predefined[commit.hash] = definition
      continue
    }

    questions.push({
      name: commit.hash,
      message: commit.title,
      type: 'list',
      choices
    })
  }

  global.spinner.succeed()

  // Prevents the spinner from getting succeeded
  // again once new spinner gets created
  global.spinner = false

  console.log(`${chalk.green('!')} Please enter the type of change for each commit:\n`)

  return inquirer.prompt(questions).then(async types => {
    // Update the spinner status
    console.log('')
    handleSpinner.create('Generating the changelog')

    const results = Object.assign({}, predefined, types)
    const grouped = groupChanges(results, changeTypes)
    const changelog = await createChangelog(grouped, commits, changeTypes)

    // Upload changelog to GitHub Releases
    return createRelease(changelog, options)
  })
}

const collectChanges = async options => {
  const {tag} = options

  handleSpinner.create('Loading commit history')

  return getCommits(tag.range).then(commits => {
    for (const commit of commits) {
      if (semVer.valid(commit.title)) {
        const index = commits.indexOf(commit)
        commits.splice(index, 1)
      }
    }

    if (commits.length < 1) {
      handleSpinner.fail('No changes happened since the last release.')
    }

    return orderCommits(commits, options)
  })
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

  if (!release) {
    return collectChanges({repo, github, tag})
  }

  if (flags.overwrite) {
    global.spinner.text = 'Overwriting release, because it already exists'
    return collectChanges({repo, github, tag, release})
  }

  global.spinner.succeed()
  console.log('')

  tasks.openRelease({release})

  throw new Error('Release already exists. Opening in browser...')
}

Object.assign(exports, tasks, {tap})
