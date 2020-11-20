// Packages
const getUsername = require('github-username');

// Utilities
const pickCommit = require('./pick-commit');

const getAuthor = async ({author}) => {
	let username;

	try {
		username = await getUsername(author);
	} catch (err) {
		return false;
	}

	return username;
};

const getChangesListText = async (changes, commits, changeTypes, filteringWithHook, showURL, credits) => {
	// This is the bullet list with each change of the type
	let text = '';

	// Find last change, in order to be able
	// to add a newline after it
	const lastChange = changes[changes.length - 1];

	for (const change of changes) {
		const changeDetails = await pickCommit(
			change,
			commits.all,
			changeTypes,
			// Do not escape HTML from commit title
			// if a custom hook is being used
			!filteringWithHook,
			showURL
		);

		if (changeDetails.text) {
			text += changeDetails.text;
		}

		if (changeDetails.credits && changeDetails.credits.length > 0) {
			changeDetails.credits.forEach(item => {
				// Don't add bots to the credits
				if (item.includes('[bot]')) {
					return;
				}

				credits.add(item);
			});
		}

		if (change === lastChange) {
			text += '\n';
		}
	}

	return text;
};

module.exports = async (types, commits, changeTypes, skippedQuestions, filteringWithHook, showURL) => {
	let text = '';
	const credits = new Set();

	for (const type in types) {
		if (!{}.hasOwnProperty.call(types, type)) {
			continue;
		}

		const changes = types[type];

		if (changes.length < 1) {
			continue;
		}

		const changesListText = await getChangesListText(changes, commits, changeTypes, filteringWithHook, showURL, credits);

		// If the user skipped the questions, we will render only the changes list without
		// the heading
		if (skippedQuestions) {
			text += changesListText;
			continue;
		}

		const typeInfo = changeTypes.filter(item => item.handle === type)[0];

		// Add heading
		text += `### ${typeInfo.pluralName} \n\n`;
		// Add the changes list
		text += changesListText;
	}

	const username = await getAuthor(commits.latest);

	// Don't include the release author in the credits
	if (username && credits.has(username)) {
		credits.delete(username);
	}

	if (credits.size > 0) {
		text += '### Credits \n\n';
		text += 'Huge thanks to ';

		// GitHub links usernames if prefixed with @
		let index = 1;
		credits.forEach(credit => {
			text += `@${credit}`;

			const penultimate = index === credits.size - 1;
			const notLast = index !== credits.size;

			if (penultimate) {
				// Oxford comma is applied when list is bigger than 2 names
				if (credits.size > 2) {
					text += ',';
				}

				text += ' and ';
			} else if (notLast) {
				text += ', ';
			}

			index += 1;
		});

		text += ' for helping!';
		text += '\n';
	}

	// Remove newlines from the end
	return {
		changelog: text.trimRight() || null,
		credits
	};
};
