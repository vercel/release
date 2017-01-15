#!/usr/bin/env node

// Packages
const asyncToGen = require('async-to-gen/register')

// Support for keywords "async" and "await"
asyncToGen({
  excludes: null
})

// Load package core with async/await support
require('../lib')
