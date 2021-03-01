// Packages
const git = require('git-state');
const repoName = require('git-repo-name');
const repoUser = require('git-username');

// Utilities
const handleSpinner = require('./spinner');

/**
 * @param {import('@octokit/rest').Octokit} githubConnection
 */
exports.getRepo = async githubConnection => {
	let repo;
	try {
		repo = await repoName();
	} catch (_) {
		handleSpinner.fail('Could not determine GitHub repository.');
		return;
	}

	const details = {repo};

	try {
		const detailedRepo = await githubConnection.repos.get({
			owner: repoUser(),
			repo: details.repo
		});
		details.user = detailedRepo.data.owner.login;
		return details;
	} catch (_) {
		handleSpinner.fail('Could not determine GitHub repository.');
		return;
	}
};

exports.branchSynced = () =>
	new Promise(resolve => {
		const path = process.cwd();

		const ignore = ['branch', 'stashes', 'untracked'];

		git.isGit(path, exists => {
			if (!exists) {
				return;
			}

			git.check(path, (err, results) => {
				if (err) {
					resolve(false);
					return;
				}

				for (const state of ignore) {
					delete results[state];
				}

				for (const result in results) {
					if (results[result] > 0) {
						resolve(false);
						break;
					}
				}

				resolve(true);
			});
		});
	});
