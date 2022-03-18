// Native
const queryString = require('querystring');

// Packages
const fetch = require('node-fetch');
const open = require('opn');
const randomString = require('random-string');
const retry = require('async-retry');
const Storage = require('configstore');
const GitHubAPI = require('@octokit/rest');
const sleep = require('delay');

// Utilities
const pkg = require('../package');
const handleSpinner = require('./spinner');

// Initialize token storage
const config = new Storage(pkg.name);

const github = new GitHubAPI({
	headers: {
		'user-agent': `Release v${pkg.version}`
	}
});

const tokenAPI = state =>
	retry(
		() =>
			new Promise(async (resolve, reject) => {
				const qs = queryString.stringify({state});
				try {
					const res = await fetch(`https://release-auth.vercel.sh/?${qs}`);
					if (res.status === 403) {
						reject(new Error('Unauthorized'));
					}
					const data = await res.json();
					if (data.error) {
						reject(res.error);
					}
					resolve(data.token);
				} catch (error) {
					reject(error);
				}
			}),
		{
			retries: 500
		}
	);

const validateToken = token =>
	new Promise(resolve => {
		github.authenticate({
			type: 'token',
			token
		});

		// See if the token works by getting
		// the data for our company's account
		github.users.getForUser(
			{
				username: 'zeit'
			},
			err => {
				if (err) {
					resolve(false);
					return;
				}

				resolve(true);
			}
		);
	});

const loadToken = async () => {
	if (config.has('token')) {
		const fromStore = config.get('token');
		const valid = await validateToken(fromStore);

		return valid ? fromStore : false;
	}

	return false;
};

const requestToken = async showURL => {
	let authURL = 'https://github.com/login/oauth/authorize';

	const state = randomString({
		length: 20
	});

	const params = {
		// eslint-disable-next-line camelcase
		client_id: '08bd4d4e3725ce1c0465',
		scope: 'repo',
		state
	};

	authURL += `?${queryString.stringify(params)}`;

	try {
		if (showURL) {
			throw new Error('No browser support');
		}

		open(authURL, {wait: false});
	} catch (err) {
		global.spinner.stop();
		console.log(`Please click this link to authenticate: ${authURL}`);
	}

	const token = await tokenAPI(state);
	config.set('token', token);

	return token;
};

module.exports = async showURL => {
	let token = await loadToken();

	if (!token) {
		handleSpinner.create(showURL ? 'Retrieving authentication link' : 'Opening GitHub authentication page');
		await sleep(100);

		try {
			token = await requestToken(showURL);
		} catch (err) {
			handleSpinner.fail('Could not load token.');
		}
	}

	github.authenticate({
		type: 'token',
		token
	});

	return github;
};
