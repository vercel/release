// Packages
const args = require('args')
const chalk = require('chalk')
const semVer = require('semver')
const inquirer = require('inquirer')
const open = require('open')
const taggedVersions = require('tagged-versions')

// Ours
const groupChanges = require('../lib/group')
const {branchSynced, getRepo} = require('../lib/repo')
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

let githubConnection
let repoDetails

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

const getReleaseURL = (release, edit = false) => {
  if (!release || !release.html_url) {
    return false
  }

  const htmlURL = release.html_url
  return edit ? htmlURL.replace('/tag/', '/edit/') : htmlURL
}

const createRelease = (tag, changelog, exists) => {
  const isPre = flags.pre ? 'pre' : ''
  handleSpinner.create(`Uploading ${isPre}release`)

  const methodPrefix = exists ? 'edit' : 'create'
  const method = methodPrefix + 'Release'

  const body = {
    owner: repoDetails.user,
    repo: repoDetails.repo,
    tag_name: tag.tag,
    target_commitish: tag.hash,
    body: changelog,
    draft: true,
    prerelease: flags.pre
  }

  if (exists) {
    body.id = exists
  }

  githubConnection.repos[method](body, (err, response) => {
    if (err) {
      console.log('\n')
      handleSpinner.fail('Failed to upload release.')
    }

    global.spinner.succeed()
    const releaseURL = getReleaseURL(response, true)

    if (releaseURL) {
      open(releaseURL)
    }

    console.log(`\n${chalk.bold('Done!')} 🎉 Opening release in browser...`)
  })
}

const orderCommits = (commits, latestTag, exists) => {
  const questions = []
  const predefined = {}

  const choices = getChoices(changeTypes, latestTag)

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

  inquirer.prompt(questions).then(async types => {
    // Update the spinner status
    console.log('')
    handleSpinner.create('Generating the changelog')

    const results = Object.assign({}, predefined, types)
    const grouped = groupChanges(results, changeTypes)
    const changelog = await createChangelog(grouped, commits, changeTypes)

    // Upload changelog to GitHub Releases
    createRelease(latestTag, changelog, exists)
  })
}

const collectChanges = (nextRelease, exists = false) => {
  handleSpinner.create('Loading commit history')

  getCommits(nextRelease.range).then(commits => {
    for (const commit of commits) {
      if (semVer.valid(commit.title)) {
        const index = commits.indexOf(commit)
        commits.splice(index, 1)
      }
    }

    if (commits.length < 1) {
      handleSpinner.fail('No changes happened since the last release.')
    }

    orderCommits(commits, nextRelease, exists)
  })
}

module.exports = exports = async () => {
  const nextRelease = await tasks.latestTag()

  if (!await branchSynced()) {
    handleSpinner.fail('Your branch needs to be up-to-date with origin.')
  }

  githubConnection = await connect()
  repoDetails = await getRepo()

  handleSpinner.create('Checking if release already exists')

  githubConnection.repos.getReleases({
    owner: repoDetails.user,
    repo: repoDetails.repo
  }, (err, response) => {
    if (err) {
      handleSpinner.fail(`Couldn't check if release exists.`)
    }

    if (response.length < 1) {
      collectChanges(nextRelease)
      return
    }

    let existingRelease = null

    for (const release of response) {
      if (release.tag_name === nextRelease.tag) {
        existingRelease = release
        break
      }
    }

    if (!existingRelease) {
      collectChanges(nextRelease)
      return
    }

    if (flags.overwrite) {
      global.spinner.text = 'Overwriting release, because it already exists'
      collectChanges(nextRelease, existingRelease.id)

      return
    }

    global.spinner.succeed()
    console.log('')

    const releaseURL = getReleaseURL(existingRelease)

    if (releaseURL) {
      open(releaseURL)
    }

    const alreadyThere = 'Release already exists. Opening in browser...'
    console.error(`${chalk.red('Error!')} ` + alreadyThere)

    process.exit(1)
  })
}

Object.assign(exports, tasks, {tap})
