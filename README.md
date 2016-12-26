![](https://raw.githubusercontent.com/zeit/art/10c6a40bfcadf774b3a9e62d01dc44201372443c/release/repo-banner-white.png)

[![Build Status](https://travis-ci.com/zeit/release.svg?token=CPbpm6MRBVbWVmDFaLxs&branch=master)](https://travis-ci.com/zeit/release)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

When run, this command line interface automatically generates a new [GitHub Release](https://help.github.com/articles/creating-releases/) and populates it with the changes (commits) added since the last release.

## Usage

Install the package from [npm](https://npmjs.com/release) (you'll need the latest version of [Node.js](https://nodejs.org)):

```bash
$ npm install -g release
```

Run this command inside your project's directory:

```bash
$ release
```

### Options

Simply run this command to get a list of all available options:

```bash
$ release -h
```

## Change Types

As described in the [SemVer guide](http://semver.org/#summary), each commit can fall into one of these categories:

- **Major Changes** (incompatible API changes)
- **Minor Changes** (functionality in a backwards-compatible manner)
- **Patches** (backwards-compatible bug fixes)

When running the `release` command, you'll be asked to provide the type for all of the commits you've created since the last release. This allows the package to automatically generate a proper changelog for you.

### Pre-Defining the Type of a Commit

If you want to automate this even further, simply specify the change type of your commits by adding it to the **title** or **description** within parenthesis:

> Error logging works now (patch)

Assuming that you've defined the type of change for a certain commit, the package won't ask you to set a type for it manually. This will make the process of creating a release much faster!

## Why?

As we at [ZEIT](https://github.com/zeit) moved all of our GitHub repositories from keeping a `HISTORY.md` file to using [GitHub Releases](https://help.github.com/articles/creating-releases/), we needed a way to automatically generate these releases from our own devices, rather than always having to open a page in the browser and manually add all commits titles to a certain version tag.

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall the package if it's already installed: `npm uninstall -g release`
3. Link the package to the global module directory: `npm link`
4. You can now use `release` on the command line!

As always, you can use `npm test` to run the tests and see if your changes have broken anything.
