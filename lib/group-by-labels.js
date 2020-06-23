const {getPullRequestByCommitMessage} = require('./get-pull-request');
const loadConfig = require('./load-config');

module.exports = async (commits, changeTypes, doEscapeHTML, showURL) => {
	const types = {};
	const config = loadConfig();

	for (const type of changeTypes) {
		types[type.handle] = [];
	}

	for (const commit of commits) {
		// Firstly try to use the commit title
		let message = commit.title;

		// If it wasn't set, try the description
		if (message.length === 0) {
			const lines = commit.description.split('\n');

			for (let line of lines) {
				if (!line) {
					continue;
				}

				line = line.replace('* ', '');

				if (line.length === 0) {
					continue;
				}

				if (line.length > 1) {
					message = line;
					break;
				}
			}
		}

		if (message.length === 0) {
			continue;
		}

		const pullRequest = await getPullRequestByCommitMessage(message, changeTypes, doEscapeHTML, showURL);

		if (!pullRequest) {
			types.__fallback.push({
				hash: commit.hash,
				message
			});
		}

		let foundLabel = false;

		// For each of the configured labels...
		for (const configLabel of config.labelsMode.labels) {
			// Check if any of the Pull Request labels matches with it
			const prContainsLabel = pullRequest.labels.some(prLabel => prLabel.name === configLabel.name);
			if (prContainsLabel) {
				types[configLabel.name].push({
					hash: commit.hash,
					message
				});
				foundLabel = true;
				break;
			}
		}

		if (!foundLabel) {
			types.__fallback.push({
				hash: commit.hash,
				message
			});
		}
	}

	return types;
};
