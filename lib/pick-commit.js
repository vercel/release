// Packages
const { coroutine } = require('bluebird');

// Ours
const cleanCommitTitle = require('./clean-title');
const getCredits = require('./credits');

module.exports = coroutine(function*(hash, all, changeTypes) {
  const related = all.filter(item => {
    return item.hash === hash;
  })[0];

  const title = cleanCommitTitle(related.title, changeTypes);
  let credits = [];

  if (title.ref) {
    hash = title.ref;

    const rawHash = hash.split('#')[1];

    // Retrieve users that have collaborated on a change
    const collaborators = yield getCredits(rawHash);

    if (collaborators) {
      credits = credits.concat(collaborators);
    }
  }

  return {
    text: `- ${title.content}: ${hash}\n`,
    credits
  };
});
