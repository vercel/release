// Packages
const ora = require('ora');
const {red} = require('chalk');

exports.create = message => {
	if (global.spinner) {
		global.spinner.succeed();
	}

	global.spinner = ora(message).start();
};

exports.succeed = () => {
	if (global.spinner) {
		global.spinner.succeed();

		// Prevents the spinner from getting succeeded
		// again once new spinner gets created
		global.spinner = null;
	}
};

exports.fail = message => {
	if (global.spinner) {
		global.spinner.fail();
		console.log('');
	}

	console.error(`${red('Error!')} ${message}`);
	process.exit(1);
};
