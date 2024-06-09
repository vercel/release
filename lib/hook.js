// Native
const {existsSync} = require('fs');
const {resolve} = require('path');

// Utilities
const handleSpinner = require('../lib/spinner');

// Apply the `release.js` file or the one that
// was specified using the `--hook` flag
function getHooks(flag) {
	let file = resolve(process.cwd(), 'release.js');

	if (!flag && !existsSync(file)) {
		return;
	}

	if (flag) {
		file = resolve(process.cwd(), flag);

		if (!existsSync(file)) {
			handleSpinner.fail(`The specified ${'--hook'} file doesn't exist`);
		}
	}

	let hook;

	try {
		hook = require(file);
	} catch (err) {
		handleSpinner.fail(err);
	}

	if (global.spinner) {
		global.spinner.succeed('Found a hook file');
	}

	return hook;
}

exports.createTagBeforeHook = async (flag, version) => {
	const hook = getHooks(flag);

	if (!hook || !hook.createTagBefore) {
		return;
	}

	try {
		await hook.createTagBefore(version);
	} catch (err) {
		handleSpinner.fail(err);
	}
};

exports.createReleaseBeforeHook = async (flag, markdown, changes) => {
	let hook = getHooks(flag);

	if (!hook) {
		return markdown;
	}

	if (typeof hook !== 'function') {
		if (hook.createReleaseBefore) {
			hook = hook.createReleaseBefore;
		} else {
			return markdown;
		}
	}

	let filtered;

	try {
		filtered = await hook(markdown, changes);
	} catch (err) {
		handleSpinner.fail(err);
	}

	return filtered;
};
