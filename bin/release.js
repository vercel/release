#!/usr/bin/env node

// Packages
const args = require('args');
const chalk = require('chalk');
const semVer = require('semver');
const inquirer = require('inquirer');
const open = require('open');
const { coroutine } = require('bluebird');
const updateNotifier = require('update-notifier');
const { red } = require('chalk');
const nodeVersion = require('node-version');

// Ours
const groupChanges = require('../lib/group');
const { branchSynced, getRepo } = require('../lib/repo');
const getCommits = require('../lib/commits');
const getChoices = require('../lib/choices');
const getTags = require('../lib/tags');
const definitions = require('../lib/definitions');
const connect = require('../lib/connect');
const createChangelog = require('../lib/changelog');
const handleSpinner = require('../lib/spinner');
const pkg = require('../package');

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(
    `${red('Error!')} Now requires at least version 6 of Node. Please upgrade!`
  );
  process.exit(1);
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (pkg.dist) {
  updateNotifier({ pkg }).notify();
}

args
  .option('pre', 'Mark the release as prerelease')
  .option('overwrite', 'If the release already exists, replace it');

const flags = args.parse(process.argv);

let githubConnection;
let repoDetails;

const changeTypes = [
  {
    handle: 'major',
    name: 'Major Change',
    description: 'incompatible API change'
  },
  {
    handle: 'minor',
    name: 'Minor Change',
    description: 'backwards-compatible functionality'
  },
  {
    handle: 'patch',
    name: 'Patch',
    description: 'backwards-compatible bug fix'
  }
];

const getReleaseURL = (release, edit = false) => {
  if (!release || !release.html_url) {
    return false;
  }

  const htmlURL = release.html_url;
  return edit ? htmlURL.replace('/tag/', '/edit/') : htmlURL;
};

const createRelease = (tag, changelog, exists) => {
  const isPre = flags.pre ? 'pre' : '';
  handleSpinner.create(`Uploading ${isPre}release`);

  const methodPrefix = exists ? 'edit' : 'create';
  const method = methodPrefix + 'Release';

  const body = {
    owner: repoDetails.user,
    repo: repoDetails.repo,
    /* eslint-disable camelcase */
    tag_name: tag.tag,
    target_commitish: tag.hash,
    /* eslint-enable camelcase */
    body: changelog,
    draft: true,
    prerelease: flags.pre
  };

  if (exists) {
    body.id = exists;
  }

  githubConnection.repos[method](body, (err, response) => {
    if (err || !response.data) {
      console.log('\n');
      handleSpinner.fail('Failed to upload release.');
    }

    global.spinner.succeed();
    const releaseURL = getReleaseURL(response.data, true);

    if (releaseURL) {
      open(releaseURL);
    }

    console.log(`\n${chalk.bold('Done!')} 🎉 Opening release in browser...`);
  });
};

const orderCommits = (commits, tags, exists) => {
  const questions = [];
  const predefined = {};

  const choices = getChoices(changeTypes, tags);

  // Show the latest changes first
  commits.reverse();

  for (const commit of commits) {
    const defTitle = definitions.type(commit.title, changeTypes);
    const defDescription = definitions.type(commit.description, changeTypes);

    const definition = defTitle || defDescription;

    if (definition) {
      predefined[commit.hash] = definition;
      continue;
    }

    questions.push({
      name: commit.hash,
      message: commit.title,
      type: 'list',
      choices
    });
  }

  global.spinner.succeed();

  // Prevents the spinner from getting succeeded
  // again once new spinner gets created
  global.spinner = false;

  console.log(
    `${chalk.green('!')} Please enter the type of change for each commit:\n`
  );

  inquirer.prompt(questions).then(
    coroutine(function*(types) {
      // Update the spinner status
      console.log('');
      handleSpinner.create('Generating the changelog');

      const results = Object.assign({}, predefined, types);
      const grouped = groupChanges(results, changeTypes);
      const changelog = yield createChangelog(grouped, commits, changeTypes);

      // Upload changelog to GitHub Releases
      createRelease(tags[0], changelog, exists);
    })
  );
};

const collectChanges = (tags, exists = false) => {
  handleSpinner.create('Loading commit history');

  getCommits(tags).then(commits => {
    for (const commit of commits) {
      if (semVer.valid(commit.title)) {
        const index = commits.indexOf(commit);
        commits.splice(index, 1);
      }
    }

    if (commits.length < 1) {
      handleSpinner.fail('No changes happened since the last release.');
    }

    orderCommits(commits, tags, exists);
  });
};

const checkReleaseStatus = coroutine(function*() {
  let tags;

  try {
    tags = yield getTags();
  } catch (err) {
    handleSpinner.fail('Directory is not a Git repository.');
  }

  if (tags.length < 1) {
    handleSpinner.fail('No tags available for release.');
  }

  const synced = yield branchSynced();

  if (!synced) {
    handleSpinner.fail('Your branch needs to be up-to-date with origin.');
  }

  githubConnection = yield connect();
  repoDetails = yield getRepo();

  handleSpinner.create('Checking if release already exists');

  githubConnection.repos.getReleases(
    {
      owner: repoDetails.user,
      repo: repoDetails.repo
    },
    (err, response) => {
      if (err) {
        handleSpinner.fail("Couldn't check if release exists.");
      }

      if (!response.data || response.data.length < 1) {
        collectChanges(tags);
        return;
      }

      let existingRelease = null;

      for (const release of response.data) {
        if (release.tag_name === tags[0].tag) {
          existingRelease = release;
          break;
        }
      }

      if (!existingRelease) {
        collectChanges(tags);
        return;
      }

      if (flags.overwrite) {
        global.spinner.text = 'Overwriting release, because it already exists';
        collectChanges(tags, existingRelease.id);

        return;
      }

      global.spinner.succeed();
      console.log('');

      const releaseURL = getReleaseURL(existingRelease);

      if (releaseURL) {
        open(releaseURL);
      }

      const alreadyThere = 'Release already exists. Opening in browser...';
      console.error(`${chalk.red('Error!')} ` + alreadyThere);

      process.exit(1);
    }
  );
});

checkReleaseStatus();
