// Packages
const capitalize = require('capitalize');
const escapeGoat = require('escape-goat');

// Utilities
const connect = require('./connect');
const repo = require('./repo');
const definitions = require('./definitions');

const getPullRequest = async (number, showURL) => {
	const github = await connect(showURL);
	const repoDetails = await repo.getRepo(github);

	const response = await github.pullRequests.get({
		owner: repoDetails.user,
		repo: repoDetails.repo,
		number
	});

	return response.data;
};

const forPullRequest = async (number, showURL) => {
	let data;

	try {
		data = await getPullRequest(number, showURL);
	} catch (err) {
		return;
	}

	if (data.user) {
		return [data.user.login];
	}

	return false;
};

const cleanCommitTitle = (title, changeTypes, doEscapeHTML) => {
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
