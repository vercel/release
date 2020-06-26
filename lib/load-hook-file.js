// Native
const {existsSync} = require('fs');
const {resolve} = require('path');

// Packages
const defaultsDeep = require('lodash.defaultsdeep');

// Utilities
const handleSpinner = require('./spinner');

const defaultConfig = {
	skipQuestions: false
};

let cachedResult = null;

module.exports = flag => {
	if (cachedResult) {
		return cachedResult;
	}

	let file = resolve(process.cwd(), 'release.js');

	if (!flag && !existsSync(file)) {
		return {hook: null, config: defaultConfig};
	}

	if (flag) {
		file = resolve(process.cwd(), flag);

		if (!existsSync(file)) {
			handleSpinner.fail(`The specified ${'--hook'} file doesn't exist`);
		}
	}

	handleSpinner.create('Found a hook file');
	let hook;

	try {
		hook = require(file);
	} catch (err) {
		handleSpinner.fail(err);
	}

	if (typeof hook !== 'function') {
		handleSpinner.fail(`The release hook file doesn't export a function`);
	}

	const config = defaultsDeep(hook.config || {}, defaultConfig);
	delete hook.config;

	cachedResult = {hook, config};

	handleSpinner.succeed();

	return cachedResult;
};
