# release

[![Build Status](https://travis-ci.com/zeit/release.svg?token=CPbpm6MRBVbWVmDFaLxs&branch=master)](https://travis-ci.com/zeit/release)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

When run, this command line interface automatically generates a new [GitHub Release](https://help.github.com/articles/creating-releases/) and populates it with the changes (commits) added since the last release.

## Usage

Install the package from [npm](https://npmjs.com/release):

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

### Change Types

As described in the [Semantic Versioning](http://semver.org/#summary) guide, each commit can fall into one of these categories:

- **Major Change** (incompatible API change)
- **Minor Change** (backwards-compatible functionality)
- **Patch** (backwards-compatible bug fix)

After running the `release` command, you'll be asked to provide a type for the commits you've created since the last release. This allows the package to automatically generate a proper changelog for you.

If you want to automate this even further, simply specify the change type of your commits by adding it to the title or description. Here's an example of how such a commit title could look like:

> Fixed error logging (patch)

## Why?

As we at [ZEIT](https://github.com/zeit) moved all of our GitHub repositories from keeping a `HISTORY.md` file to using [GitHub Releases](https://help.github.com/articles/creating-releases/), we needed a way to automatically generate these releases from our own devices, rather than always having to open a page in the browser and manually add all commits titles to a certain version tag.

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall the package if it's already installed: `npm uninstall -g release`
3. Link the package to the global module directory: `npm link`
4. You can now use `release` on the command line!

As always, you can use `npm test` to run the tests and see if your changes have broken anything.
