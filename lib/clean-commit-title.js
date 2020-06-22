// Packages
const capitalize = require('capitalize');
const escapeGoat = require('escape-goat');

// Utilities
const definitions = require('./definitions');

module.exports = (title, changeTypes, doEscapeHTML) => {
	const toReplace = {
		type: definitions.type(title, changeTypes),
		ref: definitions.reference(title)
	};

	for (const definition in toReplace) {
		if (!{}.hasOwnProperty.call(toReplace, definition)) {
			continue;
		}

		const state = toReplace[definition];

		if (state) {
			title = title.replace(`(${state})`, '');
		}
	}

	if (doEscapeHTML) {
		title = escapeGoat.escape(title);
	}

	return {
		content: capitalize(title).trim(),
		ref: toReplace.ref
	};
};
