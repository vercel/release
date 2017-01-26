'use strict'

// Packages
const open = require('open')
const semVer = require('semver')

class Release {

  constructor({pre = null, github = null} = {}) {
    this.body = null
    this.changes = null
    this.client = github
    this.commits = null
    this.credits = null
    this.data = null
    this.owner = null
    this.pre = pre
    this.previous = null
    this.repo = null
    this.target = null
  }

  get id() {
    return this.data && this.data.id
  }

  get name() {
    return (this.data && this.data.name) || null
  }

  get tagName() {
    return this.target && this.target.tag
  }

  get targetCommitish() {
    return this.target && this.target.hash
  }

  get isDraft() {
    return this.data ? this.data.draft : true
  }

  get isPrerelease() {
    if (this.pre !== null) {
      return this.pre
    }

    if (this.data !== null) {
      return this.data.prerelease
    }

    return (
      this.target !== null &&
      semVer.prerelease(this.target.version) !== null
    )
  }

  get range() {
    if (!this.target || !this.target.hash) {
      throw new Error('The release tag is not set.')
    }

    if (!this.previous || !this.previous.tag) {
      throw new Error('The previous release tag is not set.')
    }

    const [{tag}, {hash}] = [this.previous, this.target]

    return `${tag}..${hash}`
  }

  get type() {
    if (!this.target || !this.target.version) {
      throw new Error('The release tag is not set.')
    }

    if (!this.previous || !this.previous.version) {
      throw new Error('The previous release tag is not set.')
    }

    return semVer.diff(this.target.version, this.previous.version)
  }

  get payload() {
    if (!this.target || !this.target.tag) {
      throw new Error('Cannot create/edit a release without a tag name.')
    }

    if (!this.owner || !this.repo) {
      throw new Error('Cannot create/edit a release without a repo or a repo owner.')
    }

    return {
      owner: this.owner,
      repo: this.repo,
      tag_name: this.tagName,
      body: this.body || undefined,
      name: this.name || undefined,
      target_commitish: this.targetCommitish || undefined,
      draft: this.isDraft,
      prerelease: this.isPrerelease
    }
  }

  url(edit = false) {
    if (!this.data || !this.data.html_url) {
      return null
    }

    const htmlURL = this.data.html_url

    return edit ? htmlURL.replace('/tag/', '/edit/') : htmlURL
  }

  open({edit, opener = open} = {}) {
    const releaseURL = this.url(edit)

    if (releaseURL !== null) {
      opener(releaseURL)
    }

    return releaseURL
  }

  async load() {
    if (!this.target || !this.target.tag) {
      throw new Error('The release tag is not set.')
    }

    if (!this.owner || !this.repo) {
      throw new Error('Cannot load a release without a repo or a repo owner.')
    }

    const {owner, repo, target: {tag}} = this
    const releases = await this.client.repos.getReleases({owner, repo}).catch(() => [])

    this.data = null

    for (const release of releases) {
      if (release.tag_name === tag) {
        this.data = release
        break
      }
    }

    return this
  }

  save() {
    return this.id ? this.edit() : this.create()
  }

  async create() {
    if (this.id) {
      throw new Error('This release already exist.')
    }

    this.data = await this.client.repos.createRelease(this.payload)

    return this
  }

  async edit() {
    if (!this.id) {
      throw new Error('Cannot edit a release without its id.')
    }

    const payload = Object.assign(this.payload, {id: this.id})

    this.data = await this.client.repos.editRelease(payload)

    return this
  }

  toJSON() {
    return this.payload
  }

}

exports.create = config => new Release(config)
