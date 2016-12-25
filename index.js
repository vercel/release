#!/usr/bin/env node

// Native
const path = require('path')
const {execSync} = require('child_process')

// Packages
const GitHubAPI = require('github')
const args = require('args')
const {red, green} = require('chalk')
const stripWhitespace = require('trim')
const gitCommits = require('git-commits')
const semVer = require('semver')
const inquirer = require('inquirer')
const {plural} = require('pluralize')
const capitalize = require('capitalize')
const ora = require('ora')
const isURL = require('is-url')
const parseRepo = require('github-url-to-object')

// Ours
const pkg = require('./package')

args
  .option('draft', `Don't publish the release right away`)
  .option('overwrite', 'If the release already exists, replace it')

const flags = args.parse(process.argv)

let spinner
let githubConnection
let repoDetails

const abort = msg => {
  console.error(`${red('Error!')} ${msg}`)
  process.exit(1)
}

const newSpinner = message => {
  if (spinner) {
    spinner.succeed()
  }

  spinner = ora(message).start()
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

const getChoices = () => {
  const list = []

  for (const type of changeTypes) {
    const short = type.handle

    list.push({
      name: `${type.name} (${type.description})`,
      value: short,
      short: '(' + short + ')'
    })
  }

  return list.concat([
    new inquirer.Separator(),
    {
      name: 'Ignore',
      short: '(ignored)',
      value: 'ignore'
    }
  ])
}

const findToken = () => {
  const cmd = 'security find-internet-password -s github.com -g -w'
  let token

  try {
    token = execSync(cmd, {
      stdio: [
        'ignore',
        'pipe',
        'ignore'
      ]
    })
  } catch (err) {
    abort('Could not find GitHub token in Keychain.')
  }

  return stripWhitespace(String(token))
}

const connector = () => {
  newSpinner('Searching for GitHub token on device')
  const token = findToken()

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

const getCommits = () => new Promise(resolve => {
  const repoPath = path.join(process.cwd(), '.git')
  const commits = []

  gitCommits(repoPath, {
    limit: 10
  }).on('data', commit => {
    commits.push(commit)
  }).on('error', () => {
    abort('Not able to collect commits.')
  }).on('end', () => {
    resolve(commits)
  })
})

const typeDefined = commitTitle => {
  for (const type of changeTypes) {
    const handle = '(' + type.handle + ')'

    if (commitTitle.includes(handle)) {
      return type.handle
    }
  }

  return false
}

const groupChanges = changes => {
  const types = {}

  for (const type of changeTypes) {
    types[type.handle] = []
  }

  for (const change in changes) {
    if (!{}.hasOwnProperty.call(changes, change)) {
      continue
    }

    const changeType = changes[change]

    if (changeType === 'ignore') {
      continue
    }

    types[changeType].push(change)
  }

  return types
}

const cleanCommitTitle = title => {
  const definition = typeDefined(title)

  // If commit title contains the change type definition,
  // we need to hide it in the changelog
  if (definition) {
    title = title.replace('(' + definition + ')', '')
  }

  // Capitalize and remove trailing whitespace
  return stripWhitespace(capitalize(title))
}

const pickCommit = (hash, all) => {
  const related = all.filter(item => {
    return item.hash === hash
  })[0]

  const title = cleanCommitTitle(related.title)
  return `- ${title}: ${hash}\n`
}

const createChangelog = (types, commits) => {
  let text = ''

  for (const type in types) {
    if (!{}.hasOwnProperty.call(types, type)) {
      continue
    }

    const changes = types[type]

    if (changes.length < 1) {
      continue
    }

    const typeInfo = changeTypes.filter(item => {
      return item.handle === type
    })[0]

    // Add heading
    text += `### ${plural(typeInfo.name)} \n\n`

    // Find last change, in order to be able
    // to add a newline after it
    const lastChange = changes[changes.length - 1]

    for (const change of changes) {
      text += pickCommit(change, commits)

      if (change === lastChange) {
        text += '\n'
      }
    }
  }

  // Remove newlines from the end
  return stripWhitespace.right(text)
}

const getRepo = field => {
  if (typeof field === 'string') {
    if (isURL(field)) {
      return parseRepo(field)
    }

    return parseRepo(`github:${field}`)
  }

  if (field.url) {
    return parseRepo(field.url)
  }

  abort('Could not determine GitHub repository.')
}

const getReleaseURL = version => {
  if (!repoDetails) {
    return ''
  }

  let releaseURL = `https://github.com/${repoDetails.user}`
  releaseURL += `/${repoDetails.repo}/releases`
  releaseURL += `/tag/${version}`

  return releaseURL
}

const createRelease = (tag_name, changelog, exists) => {
  newSpinner('Uploading release' + (flags.draft ? ' as draft' : ''))

  const methodPrefix = exists ? 'edit' : 'create'
  const method = methodPrefix + 'Release'

  const body = {
    owner: repoDetails.user,
    repo: repoDetails.repo,
    tag_name,
    body: changelog,
    draft: flags.draft
  }

  if (exists) {
    body.id = exists
  }

  githubConnection.repos[method](body)
  spinner.succeed()

  console.log(`\nDone! 🎉`)
  console.log(`Here's the release: ${getReleaseURL(tag_name)}`)
}

const orderCommits = (commits, latest, exists) => {
  const questions = []
  const predefined = {}

  // Show the latest changes first
  commits.reverse()

  for (const commit of commits) {
    if (semVer.valid(commit.title)) {
      continue
    }

    const definition = typeDefined(commit.title)

    if (definition) {
      predefined[commit.hash] = definition
      continue
    }

    questions.push({
      name: commit.hash,
      message: commit.title,
      type: 'list',
      choices: getChoices()
    })
  }

  spinner.succeed()

  // Prevents the spinner from getting succeeded
  // again once new spinner gets created
  spinner = false

  console.log(`${green('!')} Please enter the type of change for each commit:\n`)

  inquirer.prompt(questions).then(types => {
    // Update the spinner status
    console.log('')
    newSpinner('Generating the changelog')

    const results = Object.assign({}, predefined, types)
    const grouped = groupChanges(results)
    const changelog = createChangelog(grouped, commits)

    // Upload changelog to GitHub Releases
    createRelease(latest.title, changelog, exists)
  })
}

const collectChanges = exists => {
  newSpinner('Loading commit history')

  getCommits().then(commits => {
    const latestCommit = commits[0]

    if (!latestCommit) {
      abort('Could not load latest commits.')
    }

    const isTag = semVer.valid(latestCommit.title)

    if (!isTag) {
      abort('The latest commit wasn\'t created by `npm version`.')
    }

    orderCommits(commits, latestCommit, exists)
  })
}

const checkReleaseStatus = project => {
  githubConnection = connector()
  repoDetails = getRepo(project.repository)

  newSpinner('Checking if release already exists')

  githubConnection.repos.getReleaseByTag({
    owner: repoDetails.user,
    repo: repoDetails.repo,
    tag: project.version
  }, (err, response) => {
    if (err) {
      collectChanges(false)
      return
    }

    if (flags.overwrite) {
      spinner.text = 'Overwriting release, because it already exists'
    }

    if (flags.overwrite) {
      collectChanges(response.id)
      return
    }

    spinner.succeed()
    console.log('')

    const releaseURL = getReleaseURL(project.version)
    abort(`Release already exists: ${releaseURL}`)
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
