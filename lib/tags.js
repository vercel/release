// Packages
const semVer = require('semver');
const taggedVersions = require('tagged-versions');
const childProcess = require('child-process-promise');

let defaultRev = 'HEAD --first-parent ';

runCommand('git rev-parse --abbrev-ref HEAD').then((output) => {
	defaultRev += output;
})

/**
 * Run shell command and resolve with stdout content
 *
 * @param  {string} command Shell command
 * @return {Promise<string,Error>}
 */
function runCommand(command) {
	return childProcess.exec(command)
		.then(result => result.stdout);
}

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
