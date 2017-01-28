// Packages
import test from 'ava'
import sinon from 'sinon'

// Ours
import pipeline from '../lib/pipeline'

function wait(delay = 10) {
  return new Promise(resolve => setTimeout(resolve, delay))
}

function defineTasks() {
  const task1 = sinon.spy(() => async release => {
    await wait()
    release.task1 = true

    return release
  })

  const task2 = sinon.spy(() => async release => {
    release.task2 = release.task1 && true

    return release
  })

  return [task1, task2]
}

test('combine task to run them serially', async t => {
  const config = {}
  const tasks = defineTasks()
  const task = pipeline.serial(config, ...tasks)
  const release = await task({})

  t.true(release.task1)
  t.true(release.task2)

  t.true(tasks[0].calledOnce)
  t.true(tasks[0].calledWithExactly(config))
  t.true(tasks[1].calledOnce)
  t.true(tasks[1].calledWithExactly(config))
})

test('combine task to run them in parallel', async t => {
  const config = {}
  const tasks = defineTasks()
  const task = pipeline.parallel(config, ...tasks)
  const release = await task({})

  t.true(release.task1)
  t.falsy(release.task2)

  t.true(tasks[0].calledOnce)
  t.true(tasks[0].calledWithExactly(config))
  t.true(tasks[1].calledOnce)
  t.true(tasks[1].calledWithExactly(config))
})

test('create empty task when there no task to combine', async t => {
  const release = {}
  let task = pipeline.serial({})

  t.is(await task(release), release)

  task = pipeline.parallel({})
  t.is(await task(release), release)
})

test('create a simple task task when there one task to combine', async t => {
  const release = {}
  let task = pipeline.serial({}, defineTasks()[0])
  let result = await task(release)

  t.true(result.task1)

  task = pipeline.parallel({}, defineTasks()[0])
  result = await task(release)
  t.true(result.task1)
})

test('task constructors can throw', t => {
  t.throws(() => pipeline.serial({}, () => {
    throw new Error()
  }))

  t.throws(() => pipeline.parallel({}, () => {
    throw new Error()
  }))
})

test('a combined task reject when one of the task does', async t => {
  let task = pipeline.serial({}, () => () => {
    throw new Error()
  })

  await t.throws(task({}))

  task = pipeline.parallel({}, () => () => {
    throw new Error()
  })

  await t.throws(task({}))
})
