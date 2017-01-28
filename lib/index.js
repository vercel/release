'use strict'

// Ours
const tasks = require('../lib/tasks')
const promise = require('../lib/promise')
const pipeline = require('../lib/pipeline')
const {create: release} = require('../lib/release')

module.exports = exports = config => pipeline.serial(
  config,
  config => pipeline.parallel(config, tasks.start, tasks.inSync),
  tasks.latestTag,
  tasks.canRelease,
  tasks.getCommits,
  tasks.promptTypes,
  tasks.renderChanges,
  tasks.publish
)

Object.assign(exports, {
  tasks,
  promise,
  pipeline,
  release
})
