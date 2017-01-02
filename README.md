![](https://raw.githubusercontent.com/zeit/art/5824d39f6b3f714c51d40e8cdc4cb2673142527a/release/repo-banner.png)

[![Build Status](https://travis-ci.org/zeit/release.svg?branch=master)](https://travis-ci.org/zeit/release)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

When run, this command line interface automatically generates a new draft for a [GitHub Release](https://help.github.com/articles/creating-releases/) and populates it with the changes (commits) made since the last release.

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

The following command will show you a list of all available options:

```bash
$ release -h
```

## Change Types

As described in the [Semantic Versioning guide](http://semver.org/#summary), a commit falls into one of these categories:

- **Major Changes** (incompatible API changes)
- **Minor Changes** (functionality in a backwards-compatible manner)
- **Patches** (backwards-compatible bug fixes)

When running the `release` command, you'll be asked to provide the types for all of the commits you've created since the last release. This allows the package to automatically generate a proper changelog for you.

### Pre-Defining the Type of a Commit

If you want to automate this even further, specify the change type of your commits by adding it to the **title** or **description** within parenthesis:

> Error logging works now (patch)

Assuming that you've defined it for a certain commit, the package won't ask you to set a type for it manually. This will make the process of creating a release much faster.

## Why?

As we at [ZEIT](https://github.com/zeit) moved all of our GitHub repositories from keeping a `HISTORY.md` file to using [GitHub Releases](https://help.github.com/articles/creating-releases/), we needed a way to automatically generate these releases from our own devices, rather than always having to open a page in the browser and manually add the notes for each change.

## Contributing

You can find the authentication flow [here](https://github.com/zeit/release-auth).

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall the package if it's already installed: `npm uninstall -g release`
3. Link the package to the global module directory: `npm link`
4. You can now use `release` on the command line!

As always, you can use `npm test` to run the tests and see if your changes have broken anything.

## Credits

Thanks a lot to [Daniel Chatfield](https://github.com/danielchatfield) for donating the "release" name on [npm](https://www.npmjs.com) and [my lovely team](https://zeit.co/about) for telling me about their needs and how I can make this package as efficient as possible.

## Author

Leo Lamprecht ([@notquiteleo](https://twitter.com/notquiteleo)) - [▲ZEIT](https://zeit.co)
