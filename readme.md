![](https://raw.githubusercontent.com/zeit/art/e0348ab1848337de87ccbb713fa33345aa0ba153/release/repo-banner.png)

[![Build Status](https://travis-ci.org/zeit/release.svg?branch=master)](https://travis-ci.org/zeit/release)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](http://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

When run, this command line interface automatically generates a new [GitHub Release](https://help.github.com/articles/creating-releases/) and populates it with the changes (commits) made since the last release.

## Usage

Install the package from [npm](https://npmjs.com/release) (you'll need at least Node.js 7.6.0):

```bash
npm install -g release
```

Run this command inside your terminal (in your project's directory):

```bash
release
```

You can find an example of how to prepare a release in your project [here](#example).

### Incrementing Version Tags

To bump the version inside `package.json` or `package-lock.json`, run this command (`npm version` is similar to this but will prefix version tags with "v"):

```bash
release <major|minor|patch>
```

### Options

The following command will show you a list of all available options:

```bash
release help
```

## Example

After [installing](https://github.com/zeit/release) the package, move into the directory of your project:

```bash
cd <your-projects-path>
```

Inside the directory, make sure you've committed and pushed everything:

```bash
git status
```

If it says "your branch is up-to-date", you're fine. Otherwise, please commit things that haven't already been committed and push the remaining commits to the origin.

Once you're sure that the branch is up-to-date, create a new [Git Tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) and push it:

```bash
git tag <version-number>
git push --tags
```

Now you're good to run this command (which will create a [GitHub Release](https://help.github.com/articles/creating-releases/) for you):

```bash
release
```

Done! 🎉 It's that easy.

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

To pre-define that a commit should be excluded from the list, you can use this keyword:

> This is a commit message (ignore)

## Custom Hook

Sometimes you might want to filter the information that gets inserted into new releases by adding an intro text, replacing certain data or just changing the order of the changes.

With a custom hook, the examples above (and many more) are very easy to accomplish:

By default, release will look for a file named `release.js` in the root directory of your project. This file should export a function with two parameters and always return a `String` (the final release):

```js
module.exports = (markdown, metaData) => {
  // Use the available data to create a custom release
  return markdown
}
```

In the example above, `markdown` contains the release as a `String` (if you just want to replace something). In addition, `metaData` contains these properties:

| Property Name    | Content                                               |
|------------------|-------------------------------------------------------|
| `changeTypes`    | The types of changes and their descriptions           |
| `commits`        | A list of commits since the latest release            |
| `groupedCommits` | Similar to `commits`, but grouped by the change types |
| `authors`        | The GitHub usernames of the release collaborators     |

**Hint:** You can specify a custom location for the hook file using the `--hook` or `-H` flag, which takes in a path relative to the current working directory.

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
