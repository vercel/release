// Packages
const git = require('git-state');
const repoName = require('git-repo-name');
const repoUser = require('git-username');

// Utilities
const handleSpinner = require('./spinner');

exports.getRepo = githubConnection =>
	new Promise(resolve => {
		repoName((err, repo) => {
			if (err) {
				handleSpinner.fail('Could not determine GitHub repository.');
				return;
			}

			const details = {repo};

			githubConnection.repos.get(
				{owner: repoUser(), repo: details.repo},
				(error, detailedRepo) => {
					if (error) {
						handleSpinner.fail('Could not determine GitHub repository.');
						return;
					}

					details.user = detailedRepo.data.owner.login;
					resolve(details);
				}
			);
		});
	});

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
