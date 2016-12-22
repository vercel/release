#!/usr/bin/env node --harmony-async-await

// Packages
const args = require('args')

// Utilities
const validateProject = require('../utils/validate')

args.parse(process.argv)
const releaseType = args.sub[0]

// Make sure that the project is ready for releases
// If it's not, throw errors to indicate the exact problem
validateProject(releaseType)

console.log(releaseType)
