// Packages
const { coroutine } = require('bluebird');

// Ours
const connect = require('./connect');
const repo = require('./repo');

const getPullRequest = number =>
  new Promise(
    coroutine(function*(resolve, reject) {
      const repoDetails = yield repo.getRepo();
      const github = yield connect();

      github.pullRequests.get(
        {
          owner: repoDetails.user,
          repo: repoDetails.repo,
          number
        },
        (err, results) => {
          if (err || !results.data) {
            reject(err);
            return;
          }

          resolve(results.data);
        }
      );
    })
  );

module.exports = coroutine(function*(number) {
  let data;

  try {
    data = yield getPullRequest(number);
  } catch (err) {
    return;
  }

  if (data.user) {
    return [data.user.login];
  }

  return false;
});
