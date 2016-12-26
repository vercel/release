#!/usr/bin/env node --harmony-async-await

// Native
const path = require('path')

// Packages
const GitHubAPI = require('github')
const args = require('args')
const chalk = require('chalk')
const semVer = require('semver')
const inquirer = require('inquirer')
const ora = require('ora')
const open = require('open')

// Ours
const pkg = require('../package')
const groupChanges = require('../lib/group')
const getRepo = require('../lib/repo')
const abort = require('../lib/abort')
const getCommits = require('../lib/commits')
const getChoices = require('../lib/choices')
const typeDefined = require('../lib/type')
const {loadToken, requestToken} = require('../lib/token')
const createChangelog = require('../lib/changelog')

args
  .option('pre', 'Mark the release as prerelease')
  .option('overwrite', 'If the release already exists, replace it')

const flags = args.parse(process.argv)

let spinner
let githubConnection
let repoDetails

const newSpinner = message => {
  if (spinner) {
    spinner.succeed()
  }

  spinner = ora(message).start()
}

const failSpinner = message => {
  if (spinner) {
    spinner.fail()
  }

  console.log('')
  abort(message)
}

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

const createRelease = (tag_name, changelog, exists) => {
  const isPre = flags.pre ? 'pre' : ''
  newSpinner(`Uploading ${isPre}release`)

  const methodPrefix = exists ? 'edit' : 'create'
  const method = methodPrefix + 'Release'

  const body = {
    owner: repoDetails.user,
    repo: repoDetails.repo,
    tag_name,
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
      abort('Failed to upload release.')
    }

    spinner.succeed()
    const releaseURL = getReleaseURL(response, true)

    if (releaseURL) {
      open(releaseURL)
    }

    console.log(`\n${chalk.bold('Done!')} 🎉 Opening release in browser...`)
  })
}

const orderCommits = (commits, latest, exists) => {
  const questions = []
  const predefined = {}

  // Show the latest changes first
  commits.reverse()

  for (const commit of commits) {
    const defTitle = typeDefined(commit.title, changeTypes)
    const defDescription = typeDefined(commit.description, changeTypes)

    const definition = defTitle || defDescription

    if (definition) {
      predefined[commit.hash] = definition
      continue
    }

    questions.push({
      name: commit.hash,
      message: commit.title,
      type: 'list',
      choices: getChoices(changeTypes)
    })
  }

  spinner.succeed()

  // Prevents the spinner from getting succeeded
  // again once new spinner gets created
  spinner = false

  console.log(`${chalk.green('!')} Please enter the type of change for each commit:\n`)

  inquirer.prompt(questions).then(types => {
    // Update the spinner status
    console.log('')
    newSpinner('Generating the changelog')

    const results = Object.assign({}, predefined, types)
    const grouped = groupChanges(results, changeTypes)
    const changelog = createChangelog(grouped, commits, changeTypes)

    // Upload changelog to GitHub Releases
    createRelease(latest.title, changelog, exists)
  })
}

const collectChanges = (exists = false) => {
  newSpinner('Loading commit history')

  getCommits().then(commits => {
    const latestCommit = commits.shift()

    if (!latestCommit) {
      failSpinner('Could not load latest commits.')
    }

    const isTag = semVer.valid(latestCommit.title)

    if (!isTag) {
      failSpinner('The latest commit wasn\'t created by `npm version`.')
    }

    for (const commit of commits) {
      if (semVer.valid(commit.title)) {
        const index = commits.indexOf(commit)
        commits = commits.slice(0, index)
        break
      }
    }

    if (commits.length < 1) {
      failSpinner('No changes happened since the last release.')
    }

    orderCommits(commits, latestCommit, exists)
  })
}

const connector = async () => {
  let token = await loadToken()

  if (!token) {
    newSpinner('Waiting for confirmation...')

    try {
      token = await requestToken()
    } catch (err) {
      failSpinner(`Couldn't load token.`)
    }
  }

  const github = new GitHubAPI({
    protocol: 'https',
    headers: {
      'user-agent': `Release v${pkg.version}`
    }
  })

  github.authenticate({
    type: 'token',
    token
  })

  return github
}

const checkReleaseStatus = async project => {
  githubConnection = await connector()
  repoDetails = getRepo(project.repository)

  newSpinner('Checking if release already exists')

  githubConnection.repos.getReleases({
    owner: repoDetails.user,
    repo: repoDetails.repo
  }, (err, response) => {
    if (err) {
      failSpinner(`Couldn't check if release exists.`)
    }

    if (response.length < 1) {
      collectChanges()
      return
    }

    let existingRelease = null

    for (const release of response) {
      if (release.tag_name === project.version) {
        existingRelease = release
        break
      }
    }

    if (!existingRelease) {
      collectChanges()
      return
    }

    if (flags.overwrite) {
      spinner.text = 'Overwriting release, because it already exists'
      collectChanges(existingRelease.id)

      return
    }

    spinner.succeed()
    console.log('')

    const releaseURL = getReleaseURL(existingRelease)

    if (releaseURL) {
      open(releaseURL)
    }

    abort(`Release already exists. Opening in browser...`)
  })
}

const infoPath = path.join(process.cwd(), 'package.json')
let info

try {
  info = require(infoPath)
} catch (err) {
  abort('Could not find a package.json file.')
}

if (!info.repository) {
  abort('No repository field inside the package.json file.')
}

if (!info.version) {
  abort('No version field inside the package.json file.')
}

checkReleaseStatus(info)
