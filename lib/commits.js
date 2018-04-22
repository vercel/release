// Native
const path = require('path');

// Packages
const gitStream = require('git-spawned-stream');

// Utilities
const handleSpinner = require('./spinner');

const loadCommits = (repoPath, rev) => {
	const inner = Date.now();
	const outer = inner - 1;

	// How the output shoud look like
	const spec = ['s', 'n', 'ae', 'b'];
	const format = `${inner}%${spec.join(`${inner}%`)}${outer}`;

	return new Promise(resolve => {
		const stream = gitStream(repoPath, [
			'rev-list',
			`--pretty=format:${format}`,
			'--header',
			rev || 'HEAD'
		]);

		let commits = [];

		stream.on('data', data => {
			const parts = data
				.toString('utf8')
				.split(outer)
				.map(item => {
					const trimmed = item.trim();

					if (trimmed.length === 0) {
						return null;
					}

					const splitted = trimmed.split(inner);
					const details = splitted.map(i => i.trim()).filter(i => i);

					return {
						hash: details[0].split(' ')[1],
						title: details[1] || '',
						description: details[3] || '',
						author: details[2]
					};
				})
				.filter(i => i);

			commits = commits.concat(parts);
		});

		stream.on('error', () => {
			handleSpinner.fail('Not able to collect commits.');
		});

		stream.on('end', () => resolve(commits));
	});
};

module.exports = async tags => {
	const [release, parent] = tags;
	let loadAll = false;

	if (!release || !parent || !parent.hash || !release.hash) {
		loadAll = true;
	}

	const rev = loadAll ? false : `${parent.hash}..${release.hash}`;
	const repoPath = path.join(process.cwd(), '.git');

	// Load the commits using `git rev-list`
	const all = await loadCommits(repoPath, rev);

	// Find the latest commit, as it's the release reference
	const latest = all.find(commit => commit.hash === release.hash);
	const latestIndex = all.indexOf(latest);

	// Remove the latest commit from the collection
	all.splice(latestIndex, 1);

	// Hand back the commits
	return {all, latest};
};
