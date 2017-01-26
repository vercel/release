'use strict'

// Ours
const tasks = require('../lib/tasks')
const promise = require('../lib/promise')
const pipeline = require('../lib/pipeline')

module.exports = exports = config => pipeline.serial(
  config,
  tasks.start,
  tasks.latestTag,
  tasks.canRelease,
  tasks.getCommits,
  tasks.promptTypes,
  tasks.renderChanges,
  tasks.publish
)

Object.assign(exports, {tasks, promise, pipeline})
