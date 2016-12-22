# release

[![Build Status](https://travis-ci.org/zeit/now-cli.svg?branch=master)](https://travis-ci.org/zeit/now-cli)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

When run, this command line interface automatically generates a new [GitHub Release](https://help.github.com/articles/creating-releases/) and populates it with the changes made since the last release.

## Why?

As we at [ZEIT](https://github.com/zeit) moved all of our GitHub repositories from keeping a `HISTORY.md` file to using [GitHub Releases](https://help.github.com/articles/creating-releases/), we needed a way to automatically generate these releases from our own devices, rather than always having to open a page in the browser and manually add all commits titles to a certain version tag.
