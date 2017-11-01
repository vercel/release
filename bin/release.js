#!/usr/bin/env node

// Packages
const args = require('args')
const chalk = require('chalk')
const semVer = require('semver')
const inquirer = require('inquirer')
const open = require('open')
const updateNotifier = require('update-notifier')
const { red } = require('chalk')
const nodeVersion = require('node-version')
const sleep = require('then-sleep')

// Utilities
const groupChanges = require('../lib/group')
const { branchSynced, getRepo } = require('../lib/repo')
const getCommits = require('../lib/commits')
const getChoices = require('../lib/choices')
const getTags = require('../lib/tags')
const definitions = require('../lib/definitions')
const connect = require('../lib/connect')
const createChangelog = require('../lib/changelog')
const handleSpinner = require('../lib/spinner')
const bumpVersion = require('../lib/bump')
const pkg = require('../package')
const applyHook = require('../lib/hook')

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(
    `${red('Error!')} Now requires at least version 6 of Node. Please upgrade!`
  )
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (pkg.dist) {
  updateNotifier({ pkg }).notify()
}

args
  .option('pre', 'Mark the release as prerelease')
  .option('overwrite', 'If the release already exists, replace it')
  .option('publish', 'Instead of creating a draft, publish the release')
  .option(['H', 'hook'], 'Specify a custom file to pipe releases through')

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

const createRelease = async (tag, changelog, exists) => {
  const isPre = flags.pre ? 'pre' : ''
  handleSpinner.create(`Uploading ${isPre}release`)

  const methodPrefix = exists ? 'edit' : 'create'
  const method = methodPrefix + 'Release'
  const { pre, publish } = flags

  const body = {
    owner: repoDetails.user,
    repo: repoDetails.repo,
    /* eslint-disable camelcase */
    tag_name: tag.tag,
    target_commitish: tag.hash,
    /* eslint-enable camelcase */
    body: changelog,
    draft: !publish,
    prerelease: pre
  }

  if (exists) {
    body.id = exists
  }

  let response

  try {
    response = await githubConnection.repos[method](body)
  } catch (err) {
    response = {}
  }

  if (!response.data) {
    console.log('\n')
    handleSpinner.fail('Failed to upload release.')
  }

  global.spinner.succeed()
  const releaseURL = getReleaseURL(response.data, !publish)

  // Wait for the GitHub UI to render the release
  await sleep(500)

  if (releaseURL) {
    open(releaseURL)
  }

  console.log(`\n${chalk.bold('Done!')} Opening release in browser...`)
}

const orderCommits = async (commits, tags, exists) => {
  const questions = []
  const predefined = {}

  const choices = getChoices(changeTypes, tags)

  // Show the latest changes first
  commits.all.reverse()

  for (const commit of commits.all) {
    const defTitle = definitions.type(commit.title, changeTypes)
    const defDescription = definitions.type(commit.description, changeTypes)

    const definition = defTitle || defDescription

    // Firstly try to use the commit title
    let message = commit.title

    // If it wasn't set, try the description
    if (message.length === 0) {
      const lines = commit.description.split('\n')

      for (let line of lines) {
        if (!line) {
          continue
        }

        line = line.replace('* ', '')

        if (line.length === 0) {
          continue
        }

        const exists = questions.find(question => question.message === line)

        if (exists) {
          continue
        }

        if (line.length > 1) {
          message = line
          break
        }
      }
    }

    // If for some reason the message is still not defined,
    // don't include it in the list
    if (message.length === 0) {
      continue
    }

    // If a type preset was found, don't include it
    // in the list either
    if (definition) {
      predefined[commit.hash] = {
        type: definition,
        message
      }

      continue
    }

    questions.push({
      name: commit.hash,
      message,
      type: 'list',
      choices
    })
  }

  global.spinner.succeed()

  // Prevents the spinner from getting succeeded
  // again once new spinner gets created
  global.spinner = false

  console.log(
    `${chalk.green('!')} Please enter the type of change for each commit:\n`
  )

  const answers = await inquirer.prompt(questions)

  for (const answer in answers) {
    if (!{}.hasOwnProperty.call(answers, answer)) {
      continue
    }

    const type = answers[answer]
    const { message } = questions.find(question => question.name === answer)

    answers[answer] = {
      type,
      message
    }
  }

  // Update the spinner status
  console.log('')
  handleSpinner.create('Generating the changelog')

  const results = Object.assign({}, predefined, answers)
  const grouped = groupChanges(results, changeTypes)
  const changes = await createChangelog(grouped, commits, changeTypes)

  const { credits, changelog } = changes

  // Apply the `release.js` file or the one that
  // was specified using the `--hook` flag
  const filtered = await applyHook(flags.hook, changelog, {
    changeTypes,
    commits,
    groupedCommits: grouped,
    authors: credits
  })

  // Upload changelog to GitHub Releases
  createRelease(tags[0], filtered, exists)
}

const collectChanges = async (tags, exists = false) => {
  handleSpinner.create('Loading commit history')

  let commits

  try {
    commits = await getCommits(tags)
  } catch (err) {
    handleSpinner.fail(err.message)
  }

  for (const commit of commits.all) {
    if (semVer.valid(commit.title)) {
      const index = commits.all.indexOf(commit)
      commits.all.splice(index, 1)
    }
  }

  if (commits.length < 1) {
    handleSpinner.fail('No changes happened since the last release.')
  }

  orderCommits(commits, tags, exists)
}

const checkReleaseStatus = async () => {
  let tags

  try {
    tags = await getTags()
  } catch (err) {
    handleSpinner.fail('Directory is not a Git repository.')
  }

  if (tags.length < 1) {
    handleSpinner.fail('No tags available for release.')
  }

  const synced = await branchSynced()

  if (!synced) {
    handleSpinner.fail('Your branch needs to be up-to-date with origin.')
  }

  githubConnection = await connect()
  repoDetails = await getRepo(githubConnection)

  handleSpinner.create('Checking if release already exists')

  let response

  try {
    response = await githubConnection.repos.getReleases({
      owner: repoDetails.user,
      repo: repoDetails.repo
    })
  } catch (err) {}

  if (!response) {
    handleSpinner.fail("Couldn't check if release exists.")
  }

  if (!response.data || response.data.length < 1) {
    collectChanges(tags)
    return
  }

  let existingRelease = null

  for (const release of response.data) {
    if (release.tag_name === tags[0].tag) {
      existingRelease = release
      break
    }
  }

  if (!existingRelease) {
    collectChanges(tags)
    return
  }

  if (flags.overwrite) {
    global.spinner.text = 'Overwriting release, because it already exists'
    collectChanges(tags, existingRelease.id)

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
}

const bumpType = args.sub

if (bumpType.length === 1) {
  const allowedTypes = []

  for (const type of changeTypes) {
    allowedTypes.push(type.handle)
  }

  const allowed = allowedTypes.includes(bumpType[0])

  if (!allowed) {
    handleSpinner.fail(
      'Version type not SemVer-compatible (major, minor or patch)!'
    )
    process.exit(1)
  }

  bumpVersion(bumpType[0])
} else {
  checkReleaseStatus()
}
