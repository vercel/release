#!/usr/bin/env node

// Native
const path = require('path')
const {execSync} = require('child_process')

// Packages
const GitHubAPI = require('github')
const args = require('args')
const {red} = require('chalk')
const byeWhitespace = require('condense-whitespace')
const gitCommits = require('git-commits')
const semVer = require('semver')
const inquirer = require('inquirer')
const {plural} = require('pluralize')

// Ours
const pkg = require('./package')

args.parse(process.argv)

const abort = msg => {
  console.error(`${red('Error!')} ${msg}`)
  process.exit(1)
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

  return byeWhitespace(String(token))
}

const connector = () => {
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

const typeDefined = commit => {
  for (const type of changeTypes) {
    const handle = '(' + type.handle + ')'

    if (commit.title.includes(handle)) {
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

const pickCommit = (hash, all) => {
  const related = all.filter(item => {
    return item.hash === hash
  })[0]

  return `- ${related.title}: ${hash}\n`
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
  return text.replace(/^\s+|\s+$/g, '')
}

const orderCommits = (commits, latest) => {
  const questions = []
  const predefined = {}

  // Show the latest changes first
  commits.reverse()

  for (const commit of commits) {
    if (semVer.valid(commit.title)) {
      continue
    }

    const definition = typeDefined(commit)

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

  inquirer.prompt(questions).then(types => {
    const results = Object.assign({}, predefined, types)
    const grouped = groupChanges(results)
    const changelog = createChangelog(grouped, commits)

    console.log(changelog)
  })
}

const changes = () => {
  getCommits().then(commits => {
    const latestCommit = commits[0]

    if (!latestCommit) {
      abort('Could not load latest commits.')
    }

    const isTag = semVer.valid(latestCommit.title)

    if (!isTag) {
      abort('The latest commit wasn\'t created by `npm version`.')
    }

    orderCommits(commits, latestCommit)
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

changes()
