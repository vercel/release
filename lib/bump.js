// Native
const path = require('path');
const {promisify} = require('util');
const {exec} = require('child_process');

// Packages
const fs = require('fs-extra');
const semver = require('semver');
const {bold} = require('chalk');

// Utilities
const {fail, create: createSpinner} = require('./spinner');

const increment = async (type, preSuffix) => {
	const pkgPath = path.join(process.cwd(), 'package.json');

	if (!fs.existsSync(pkgPath)) {
		throw new Error(`The "package.json" file doesn't exist`);
	}

	let pkgContent;

	try {
		pkgContent = await fs.readJSON(pkgPath);
	} catch (err) {
		throw new Error(`Couldn't parse "package.json"`);
	}

	if (!pkgContent.version) {
		throw new Error(`No "version" field inside "package.json"`);
	}

	const {version: oldVersion} = pkgContent;
	const isPre = semver.prerelease(oldVersion);
	const shouldBePre = type === 'pre';

	if (!isPre && shouldBePre && !preSuffix) {
		preSuffix = 'canary';
	}

	let newVersion;

	if (shouldBePre && preSuffix) {
		newVersion = semver.inc(oldVersion, type, preSuffix);
	} else {
		newVersion = semver.inc(oldVersion, type);
	}

	pkgContent.version = newVersion;

	try {
		await fs.writeJSON(pkgPath, pkgContent, {
			spaces: 2
		});
	} catch (err) {
		throw new Error(`Couldn't write to "package.json"`);
	}

	const lockfilePath = path.join(process.cwd(), 'package-lock.json');

	if (!fs.existsSync(lockfilePath)) {
		return newVersion;
	}

	let lockfileContent;

	try {
		lockfileContent = await fs.readJSON(lockfilePath);
	} catch (err) {
		throw new Error(`Couldn't parse "package-lock.json"`);
	}

	lockfileContent.version = newVersion;

	try {
		await fs.writeJSON(lockfilePath, lockfileContent, {
			spaces: 2
		});
	} catch (err) {
		throw new Error(`Couldn't write to "package-lock.json"`);
	}

	return newVersion;
};

const runGitCommand = async command => {
	try {
		await promisify(exec)(command);
	} catch (err) {
		if (err.message.includes('Not a git repository')) {
			throw new Error('Directory is not a Git repository');
		}

		throw err;
	}
};

module.exports = async (type, preSuffix) => {
	createSpinner('Bumping version tag');
	let version;

	try {
		version = await increment(type, preSuffix);
	} catch (err) {
		fail(err.message);
	}

	global.spinner.text = `Bumped version tag to ${bold(version)}`;
	createSpinner('Creating release commit');

	try {
		await runGitCommand(`git add -A && git commit -a -m "${version}"`);
	} catch (err) {
		fail(err.message);
	}

	global.spinner.text = `Created release commit`;
	createSpinner('Tagging commit');

	try {
		await runGitCommand(`git tag ${version}`);
	} catch (err) {
		fail(err.message);
	}

	global.spinner.text = `Tagged commit`;
	createSpinner('Pushing everything to remote');

	try {
		await runGitCommand(`git push && git push --tags`);
	} catch (err) {
		fail(err.message);
	}

	global.spinner.succeed(`Pushed everything to remote`);
	global.spinner = null;
};
