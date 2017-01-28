/**
 * NPM package release pattern
 *
 * 1. get commit from HEAD to last version
 * 2. parse commits
 * 3. bump version number
 * 4. push new version
 * 5. render changes
 * 6. publish release
 */

'use strict'

const path = require('path')
const fs = require('fs')

const childProcess = require('child-process-promise')
const pify = require('pify')
const semVer = require('semver')
const taggedVersions = require('tagged-versions')

const {tasks, pipeline} = require('../')

const git = {

  async remoteBranch() {
    const cmd = 'git rev-parse --abbrev-ref --symbolic-full-name @{u}'
    const [remote, ...parts] = await childProcess.exec(cmd).then(
      result => result.stdout.trim().split('/')
    )
    const name = parts.join('/')

    return {remote, name}
  },

  async hash(rev = 'HEAD') {
    return childProcess.spawn('git', ['rev-parse', rev], {capture: ['stdout']}).then(
      result => result.stdout.trim()
    )
  },

  async push(...dest) {
    return childProcess.spawn('git', ['push', ...dest])
      .catch(err => `Failed to push local branch: ${err.message}`)
  },

  async reset(hash = 'HEAD^', type = '--hard') {
    return childProcess.spawn('git', ['reset', type, hash])
  }

}

const pkg = {

  async read() {
    const pkgPath = path.resolve('package.json')
    const content = await pify(fs.readFile)(pkgPath, 'utf8')

    return JSON.parse(content)
  },

  async updateVersion(version) {
    return childProcess.spawn('npm', ['version', version])
  }

}

const commits = {
  changeTypes: [{
    type: 'feat',
    name: 'Feature',
    description: 'new functionality'
  }, {
    type: 'fix',
    name: 'Bug Fix',
    description: 'bug fix'
  }],

  parseFooter(commit) {
    const breaksRegex = /BREAKING CHANGES?:?\s+((?:.+\n?)+)/g
    const match = breaksRegex.exec(commit.description)

    if (!match) {
      return null
    }

    return match[1].trim()
  },

  parseRevertHash(commit) {
    if (commit.type !== 'revert') {
      return null
    }

    const hashRegex = /this reverts commit ([09a-f]{7,40})/gi
    const match = hashRegex.exec(commit.description)

    if (!match) {
      return null
    }

    return match[1].trim()
  },

  parseTitle(commit) {
    const titleRegex = /^([a-z]+)(\([^)]\))?:\s+(.+)\s*$/i
    const match = titleRegex.exec(commit.title)

    if (!match) {
      return null
    }

    return match.slice(1)
  },

  parse(commit) {
    const [type, scope, title] = commits.parseTitle(commit)
    const breaks = commits.parseFooter(commit)
    const revertHash = commits.parseRevertHash(commit)

    return Object.assign(commit, {type, scope, title, breaks, revertHash})
  },

  compare(a, b) {
    const aScope = a.scope || ''
    const bScope = b.scope || ''

    return aScope.localeCompare(bScope)
  }

}

const bump = {

  type({changes, pre, previous: {version}}) {
    const wasPre = semVer.prerelease(version) !== null

    if (wasPre) {
      return pre ? 'prerelease' : 'patch'
    }

    if (changes.breakingChanges.length > 0) {
      return `${pre ? 'pre' : ''}major`
    }

    const feat = changes.byType.filter(group => group.type === 'feat').pop()

    return `${pre ? 'pre' : ''}${feat ? 'minor' : 'patch'}`
  },

  version(release) {
    const bumpType = bump.type(release)

    return semVer.inc(release.previous.version, bumpType)
  }

}

const myTasks = {

  setTags({progress}) {
    return async release => {
      const info = await pkg.read()
      const version = info.version
      const prevTag = await taggedVersions.getLastVersion(`=${version}`)

      if (!prevTag) {
        throw new Error(`Failed to find latest version tag. Try pull all tags with:

          git fetch --tags

        `)
      }

      release.target = {hash: 'HEAD'}
      release.previous = prevTag

      progress.info(`Release range: ${release.range}`)

      return release
    }
  },

  groupByType() {
    return async release => {
      const byTypesMap = {}

      for (const changeType of commits.changeTypes) {
        byTypesMap[changeType.type] = Object.assign({commits: []}, changeType)
      }

      const revert = new Set(
        release.commits
          .filter(commit => commit.revertHash)
          .map(commit => commit.revertHash)
      )
      const sortedCommits = release.commits
        .filter(commit => revert.has(commit.hash) === false)
        .sort(commits.compare)
      const breakingChanges = sortedCommits.filter(commit => commit.breaks)

      sortedCommits
        .filter(commit => byTypesMap[commit.type])
        .forEach(commit => byTypesMap[commit.type].commits.push(commit))

      release.changes = {
        breakingChanges,
        byType: commits.changeTypes
          .map(type => byTypesMap[type.type])
          .filter(group => group.commits.length > 0)
      }

      return release
    }
  },

  bumpVersion(config) {
    const {progress} = config
    const canRelease = tasks.canRelease(config)

    return async release => {
      const version = bump.version(release)
      const hasPrefix = release.previous.tag.startsWith('v')

      const [branch, bckhash] = await Promise.all([
        git.remoteBranch(),
        git.hash()
      ])

      await pkg.updateVersion(version)
        .then(...progress.add(`Bump package.json with version ${version}`))

      release.target = {
        version,
        hash: await git.hash(),
        tag: hasPrefix ? `v${version}` : version
      }

      const revert = err => git.reset(bckhash).then(() => Promise.reject(err))

      await canRelease(release).catch(revert)
      await git.push(branch.remote, `HEAD:${branch.name}`)
        .then(...progress.add(`Update ${branch.remote}/${branch.name} with updated package.json`))
        .catch(revert)

      return release
    }
  }

}

const templateSource = `
{{~#each changes.byType~}}
  ### {{plural name count=commits.length}}

  {{#each commits ~}}
    -{{#if scope}} {{scope}}:{{/if}} {{title}} #{{slice hash end=7}}
  {{/each}}

{{/each}}

{{~#if credits~}}
### Credits

Huge thanks to
{{~#join credits last=' and'}} @{{.}}{{/join}} for their contributions!
{{/if}}
`

module.exports = config => {
  if (config.overwrite) {
    throw new Error('Cannot overwrite release with this plugin!\nUse default release pattern.')
  }

  config.mapper = commits.parse
  config.templateSource = templateSource

  return pipeline.serial(
    config,
    config => pipeline.parallel(
      config,
      tasks.start,
      tasks.inSync
    ),
    myTasks.setTags,
    tasks.getCommits,
    myTasks.groupByType,
    myTasks.bumpVersion,
    tasks.renderChanges,
    tasks.publish
  )
}
