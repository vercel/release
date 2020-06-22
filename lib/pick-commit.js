// Utilities
const cleanCommitTitle = require('./clean-commit-title');
const {getPullRequestByNumber} = require('./get-pull-request');

const forPullRequest = async (number, showURL) => {
	let data;

	try {
		data = await getPullRequestByNumber(number, showURL);
	} catch (err) {
		return;
	}

	if (data.user) {
		return [data.user.login];
	}

	return false;
};

module.exports = async ({hash, message}, all, changeTypes, doEscapeHTML, showURL) => {
	const title = cleanCommitTitle(message, changeTypes, doEscapeHTML);
	let credits = [];

	if (title.ref) {
		hash = title.ref;

		const rawHash = hash.split('#')[1];

		// Retrieve users that have collaborated on a change
		const collaborators = await forPullRequest(rawHash, showURL);

		if (collaborators) {
			credits = credits.concat(collaborators);
		}
	}

	return {
		text: `- ${title.content}: ${hash}\n`,
		credits
	};
};
