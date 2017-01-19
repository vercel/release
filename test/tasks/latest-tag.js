// Packages
import test from 'ava'
import sinon from 'sinon'
import taggedVersions from 'tagged-versions'

// Ours
import tasks from '../../lib/tasks'

test.beforeEach(() => {
  sinon.stub(taggedVersions, 'getList')
  taggedVersions.getList.returns(Promise.resolve(tags()))
})

test.afterEach.always(() => {
  if (taggedVersions.getList.restore) {
    taggedVersions.getList.restore()
  }
})

test.serial('query the latest tag from HEAD', async t => {
  await tasks.latestTag()

  t.true(taggedVersions.getList.calledOnce)
  t.deepEqual(taggedVersions.getList.lastCall.args, [{rev: 'HEAD', range: undefined}])
})

test.serial('resolve with the latest tag', async t => {
  const tag = await tasks.latestTag()

  t.is(tag.version, '1.1.3')
})

test.serial('resolve with the previous tag', async t => {
  const tag = await tasks.latestTag()

  t.is(tag.previous.version, '1.1.2')
})

test.serial('resolve with the release range', async t => {
  const tag = await tasks.latestTag()

  t.is(tag.range, 'v1.1.2..394b988978a720810f96dd7870c04844103ebb72')
})

test.serial('resolve with the release type', async t => {
  const tag = await tasks.latestTag()

  t.is(tag.type, 'patch')
})

test.serial('reject if the getList does', async t => {
  taggedVersions.getList.returns(Promise.reject(new Error()))

  const error = await t.throws(tasks.latestTag())

  t.regex(error.message, /not a git repository/i)
})

test.serial('reject if there is no tag', async t => {
  taggedVersions.getList.returns(Promise.resolve([]))

  const error = await t.throws(tasks.latestTag())

  t.regex(error.message, /no tag available/i)
})

test.serial('reject if there is no previous tag', async t => {
  taggedVersions.getList.returns(Promise.resolve(tags().slice(0, 1)))

  const error = await t.throws(tasks.latestTag())

  t.regex(error.message, /first release should be created manually/i)
})

function tags() {
  return [{
    tag: 'v1.1.3',
    hash: '394b988978a720810f96dd7870c04844103ebb72',
    date: new Date('2017-01-15T12:00:00.000Z'),
    version: '1.1.3'
  },
  {
    tag: 'v1.1.2',
    hash: '1d73c2ec41e22a94438c68d72089c929dd7a07e2',
    date: new Date('2017-01-07T12:00:00.000Z'),
    version: '1.1.2'
  },
  {
    tag: 'v1.1.1',
    hash: 'd977a4a6c9878e643fa7fc43d959b8b77be14631',
    date: new Date('2017-01-06T12:00:00.000Z'),
    version: '1.1.1'
  },
  {
    tag: 'v1.1.0',
    hash: '7b032c1581bccf09e93fa0e7dca8219237ea6867',
    date: new Date('2017-01-05T12:00:00.000Z'),
    version: '1.1.0'
  }]
}
