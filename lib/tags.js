// Packages
const semVer = require('semver');
const taggedVersions = require('tagged-versions');

const defaultRev = 'HEAD --first-parent `git rev-parse --abbrev-ref HEAD`';

const defaultOptions = {
	rev: defaultRev,
	previousTag: ''
};

module.exports = async (options = {}) => {
	const {rev, previousTag} = {...defaultOptions, ...options};

	const [tags, latest] = await Promise.all([
		taggedVersions.getList({rev}),
		taggedVersions.getLastVersion({rev})
	]);

	if (!latest) {
		return [];
	}

	const isPreviousTag =
		previousTag && previousTag.length > 0
			? commitVersion => commitVersion === previousTag
			: semVer.lt;

	for (const commit of tags) {
		if (isPreviousTag(commit.version, latest.version)) {
			return [latest, commit];
		}
	}

	return [latest];
};
