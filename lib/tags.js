// Packages
const semVer = require('semver');
const taggedVersions = require('tagged-versions');

const defaultRev = 'HEAD --first-parent `git rev-parse --abbrev-ref HEAD`';

module.exports = async (rev = defaultRev) => {
	const [tags, latest] = await Promise.all([
		taggedVersions.getList(),
		taggedVersions.getLastVersion({rev})
	]);

	if (!latest) {
		return [];
	}

	for (const commit of tags) {
		if (semVer.lt(commit.version, latest.version)) {
			return [latest, commit];
		}
	}

	return [latest];
};
