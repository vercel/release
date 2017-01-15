// Packages
import sinon from 'sinon'
import taggedVersions from 'tagged-versions'
import test from 'ava'

// Ours
import {inferRange} from '../../lib/steps/index'

test('is named "inferRange"', t => {
  t.is(inferRange.name, 'inferRange')
})

test('has a handler', t => {
  t.is(typeof inferRange.handler, 'function')
})

test.serial('handler should fetch the latest tag', async t => {
  const release = {}

  mockVersionsList()
  await inferRange.handler(release)

  t.true(taggedVersions.getList.calledOnce)
  t.true(taggedVersions.getList.calledWithExactly())
})

test.serial('handler should set release tags', async t => {
  const release = {}

  mockVersionsList()
  await inferRange.handler(release)

  t.is(release.tags.length, 2)
  t.is(release.tags[0].tag, '1.1.2')
  t.is(release.tags[1].tag, '1.1.1')
})

test.serial('handler should extend release tags array', async t => {
  const release = {}

  mockVersionsList()
  await inferRange.handler(release)

  t.is(release.tags.release.tag, '1.1.2')
  t.is(release.tags.previous.tag, '1.1.1')
})

test.serial('handler should use provided tags', async t => {
  const release = {
    tags: defaultList().slice(2, 4)
  }

  mockVersionsList()
  await inferRange.handler(release)

  t.false(taggedVersions.getList.called)
  t.is(release.tags[0].tag, '1.1.0')
  t.is(release.tags[1].tag, '1.0.7')
})

test.serial('handler should extend provided tags', async t => {
  const release = {
    tags: defaultList().slice(2, 4)
  }

  mockVersionsList()
  await inferRange.handler(release)

  t.is(release.tags.release.tag, '1.1.0')
  t.is(release.tags.previous.tag, '1.0.7')
})

/* **** Mocking **** */

test.afterEach.always('restore stub\'ed packages', () => {
  [taggedVersions.getList].filter(
    meth => typeof meth.restore === 'function'
  ).forEach(
    meth => meth.restore()
  )
})

function mockVersionsList(list = defaultList()) {
  sinon.stub(taggedVersions, 'getList')
  taggedVersions.getList.returns(Promise.resolve(list))
}

function defaultList() {
  return [{tag: '1.1.2',
    hash: '1d73c2ec41e22a94438c68d72089c929dd7a07e2',
    date: new Date('2017-01-07T21:06:22.000Z'),
    version: '1.1.2'
  }, {
    tag: '1.1.1',
    hash: 'd977a4a6c9878e643fa7fc43d959b8b77be14631',
    date: new Date('2017-01-06T21:30:34.000Z'),
    version: '1.1.1'
  }, {tag: '1.1.0',
    hash: '7b032c1581bccf09e93fa0e7dca8219237ea6867',
    date: new Date('2017-01-06T21:16:22.000Z'),
    version: '1.1.0'
  }, {tag: '1.0.7',
    hash: 'a019595f79b3a10315c0ce249738a2c580cedc11',
    date: new Date('2017-01-03T11:24:30.000Z'),
    version: '1.0.7'
  }]
}
