// Utilities
const connect = require('./connect');
const repo = require('./repo');
const cleanCommitTitle = require('./clean-commit-title');

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

exports.getPullRequestByNumber = (number, showURL) => getPullRequest(number, showURL);

exports.getPullRequestByCommitMessage = (message, changeTypes, doEscapeHTML, showURL) => {
	const title = cleanCommitTitle(message, changeTypes, doEscapeHTML);

	if (title.ref) {
		const hash = title.ref;
		const rawHash = hash.split('#')[1];

		// Retrieve the pull request
		return getPullRequest(rawHash, showURL);
	}

	return null;
};
