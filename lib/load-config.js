// Native
const {existsSync} = require('fs');
const {resolve} = require('path');
const defaultsDeep = require('lodash.defaultsdeep');
const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});

// Utilities
const handleSpinner = require('../lib/spinner');

const possiblePaths = ['releaseconfig.json', '.github/releaseconfig.json'];

const configSchema = {
	additionalProperties: false,
	properties: {
		labelsMode: {
			type: 'object',
			additionalProperties: false,
			properties: {
				labels: {
					type: 'array',
					items: {
						type: 'object',
						additionalProperties: false,
						required: ['name', 'sectionName'],
						properties: {
							name: {type: 'string'},
							sectionName: {type: 'string'}
						}
					}
				},
				fallbackSectionName: {type: 'string'}
			}
		}
	}
};

const validate = ajv.compile(configSchema);

const defaultConfig = {
	labelsMode: {
		labels: [],
		fallbackSectionName: 'Misc Changes'
	}
};

let cachedConfig = null;

const validateConfigFile = config => {
	const valid = validate(config);

	if (!valid) {
		handleSpinner.fail(ajv.errorsText(validate.errors, {dataVar: 'config'}));
	}
};

module.exports = () => {
	if (cachedConfig) {
		return cachedConfig;
	}

	let config = {};

	for (const filepath of possiblePaths) {
		const path = resolve(process.cwd(), filepath);

		if (existsSync(path)) {
			handleSpinner.create(`Loading config file in ./${filepath}`);

			config = require(path);
			validateConfigFile(config);
			break;
		}
	}

	cachedConfig = defaultsDeep(config, defaultConfig);

	return cachedConfig;
};
