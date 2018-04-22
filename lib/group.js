module.exports = (changes, changeTypes) => {
	const types = {};

	for (const type of changeTypes) {
		types[type.handle] = [];
	}

	for (const change in changes) {
		if (!{}.hasOwnProperty.call(changes, change)) {
			continue;
		}

		const {type, message} = changes[change];

		if (type === 'ignore') {
			continue;
		}

		types[type].push({
			hash: change,
			message
		});
	}

	return types;
};
