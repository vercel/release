# release

[![Build Status](https://travis-ci.com/zeit/release.svg?token=CPbpm6MRBVbWVmDFaLxs&branch=master)](https://travis-ci.com/zeit/release)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

When run, this command automatically handles all of the necessary steps for releasing your node project at once. Based on the configuration of your project, it also determines if certain steps need to be left out.

Here's what it does:

- `npm version <major|minor|patch>`
- `git tag`
- `git push origin master && git push --tags`
- `npm publish`
- Adding a [GitHub Release](https://help.github.com/articles/creating-releases/) and populating it

## Usage

Install the package from [npm](https://npmjs.com/release):

```bash
$ npm install -g release
```

Pick the [release type](http://semver.org/#summary) and run this command inside your project's directory:

```bash
$ release <major|minor|patch>
```

Here's what will happen after you executed the command:

### The Flow

1. The `version` property inside `package.json` will be incremented
2. All changes will be committed
3. A `git tag` will be created (points to the commit created in step 2)
4. The new commits and tags will be `git push`ed
5. Based on the git tag, a new [GitHub Release](https://help.github.com/articles/creating-releases/) will be created and populated with the changes
6. Assuming that the `private` property inside `package.json` is **not** set to `true`, the package will be published to npm
7. **DONE!** You'll see a message telling you that the release succeeded.

## Why?

As we at [ZEIT](https://github.com/zeit) moved all of our GitHub repositories from keeping a `HISTORY.md` file to using [GitHub Releases](https://help.github.com/articles/creating-releases/), we needed a way to automatically generate these releases from our own devices, rather than always having to open a page in the browser and manually add all commits titles to a certain version tag.

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Move into the directory of your clone
3. Link the package to the global module directory: `npm link`
4. You can now use `release` on the command line!

As always, you can use `npm test` to run the tests and see if your changes have broken anything.
