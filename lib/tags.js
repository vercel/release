// Packages
const semVer = require('semver');
const taggedVersions = require('tagged-versions');
const { coroutine } = require('bluebird');

module.exports = coroutine(function*(rev = 'HEAD') {
  const [tags, latest] = yield Promise.all([
    taggedVersions.getList(),
    taggedVersions.getLastVersion({ rev })
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
});
