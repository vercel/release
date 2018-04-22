// Native
const {existsSync} = require('fs');
const {resolve} = require('path');

// Utilities
const handleSpinner = require('../lib/spinner');

module.exports = async (flag, markdown, changes) => {
	let file = resolve(process.cwd(), 'release.js');

	if (!flag && !existsSync(file)) {
		return markdown;
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

	if (typeof hook !== 'function') {
		handleSpinner.fail(`The release hook file doesn't export a function`);
	}

	if (global.spinner) {
		global.spinner.succeed('Found a hook file');
	}

	let filtered;

	try {
		filtered = await hook(markdown, changes);
	} catch (err) {
		handleSpinner.fail(err);
	}

	return filtered;
};
