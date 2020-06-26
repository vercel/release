// Utilities
const handleSpinner = require('../lib/spinner');
const loadHookFile = require('./load-hook-file');

module.exports = async (flag, markdown, changes) => {
	const {hook} = loadHookFile(flag);

	if (!hook) {
		return markdown;
	}

	let filtered;

	try {
		filtered = await hook(markdown, changes);
	} catch (err) {
		handleSpinner.fail(err);
	}

	return filtered;
};
