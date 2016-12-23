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

// Ours
const pkg = require('./package')

args.parse(process.argv)

const abort = msg => {
  console.error(`${red('Error!')} ${msg}`)
  process.exit(1)
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

const orderCommits = (commits, latest) => {
  const questions = []

  for (const commit of commits) {
    questions.push({
      name: commit.hash,
      message: commit.title,
      type: 'list',
      choices: [
        'major',
        'minor',
        'patch'
      ]
    })
  }

  inquirer.prompt(questions).then(types => {
    console.log(types)
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
      abort('The last commit wasn\'t created by `npm version`.')
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
