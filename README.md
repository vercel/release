# release

[![Build Status](https://travis-ci.com/zeit/release.svg?token=CPbpm6MRBVbWVmDFaLxs&branch=master)](https://travis-ci.com/zeit/release)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

When run, this command line interface automatically generates a new [GitHub Release](https://help.github.com/articles/creating-releases/) and populates it with the changes made since the last release.

## Usage

Install the package:

```bash
$ npm install -g release
```

Run the command inside your project's directory:

```bash
$ release <major|minor|patch>
```

Once you've run the command, here's what will happen:

### The Flow

1. The `version` property inside `package.json` will be incremented
2. All changes will be committed
3. A `git tag` will be created (points to the commit created in step 2)
4. The new commits and tags will be `git push`ed
5. Based on the git tag, a new [GitHub Release](https://help.github.com/articles/creating-releases/) will be created and populated with the changes
6. Assuming that the `private` property inside `package.json` is **not** set to `true`, the package will be published to npm
7. **DONE!** You'll see a message telling you the release succeeded.

## Why?

As we at [ZEIT](https://github.com/zeit) moved all of our GitHub repositories from keeping a `HISTORY.md` file to using [GitHub Releases](https://help.github.com/articles/creating-releases/), we needed a way to automatically generate these releases from our own devices, rather than always having to open a page in the browser and manually add all commits titles to a certain version tag.

## Caught a Bug?

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Link the package to the global module directory: `npm link`
3. You can now use `release` on the command line!

As always, you can use `npm test` to run the tests and see if your changes have broken anything.
