// Native
const {existsSync} = require('fs');
const {resolve} = require('path');
const defaultsDeep = require('lodash.defaultsdeep');

// Utilities
const handleSpinner = require('../lib/spinner');

const possiblePaths = ['releaseconfig.json', '.github/releaseconfig.json'];

const defaultConfig = {
	labelsMode: {
		labels: [],
		fallbackSectionName: 'Misc',
		fallbackSectionPluralName: 'Misc'
	}
};

let cachedConfig = null;

module.exports = () => {
	if (cachedConfig) {
		return cachedConfig;
	}

	let config = {};

	possiblePaths.forEach(filepath => {
		const path = resolve(process.cwd(), filepath);

		if (existsSync(path)) {
			handleSpinner.create(`Loading config file in ./${filepath}`);

			config = require(path);
		}
	});

	global.spinner.succeed();

	cachedConfig = defaultsDeep(config, defaultConfig);

	return cachedConfig;
};
