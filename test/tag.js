// Packages
import ps from 'child-process-promise'
import sinon from 'sinon'
import test from 'ava'
import taggedVersions from 'tagged-versions'

// Ours
import tag from '../lib/tag'

test('create Tag from version and hash', t => {
  const version = '1.0.0'
  const hash = '1234567'
  const v1 = tag.from({version, hash})

  t.deepEqual(v1.version, version)
  t.deepEqual(v1.tag, version)
  t.deepEqual(v1.hash, hash)
})

test('create Tag from tagged-versions tag', t => {
  const vTag = {
    tag: 'v1.1.2',
    hash: '1234567',
    date: new Date(),
    version: '1.1.2'
  }
  const v1 = tag.from(vTag)

  t.true(v1.hasPrefix)
  t.deepEqual(v1.version, vTag.version)
  t.deepEqual(v1.tag, vTag.tag)
  t.deepEqual(v1.hash, vTag.hash)
  t.deepEqual(v1.date, vTag.date)
})

test('create Tag with out version throws', t => {
  t.throws(() => tag.from({hash: '1234567'}))
})

test('create Tag with  invalid version throws', t => {
  t.throws(() => tag.from({version: '1.2', hash: '1234567'}))
})

test('create Tag with out a hash throws', t => {
  t.throws(() => tag.from({version: '1.2.3'}))
})

test('create Tag with out invalid sha1 hash throws', t => {
  const version = '1.2.3'
  const withHash = hash => () => tag.from({version, hash})

  t.throws(withHash('1'.repeat(6)), /invalid/, 'too short hash')
  t.throws(withHash('1'.repeat(41)), /invalid/, 'too long hash')
  t.throws(withHash('g'.repeat(6)), /invalid/, 'invalid char')

  t.notThrows(withHash('1'.repeat(7)), 'long enough')
  t.notThrows(withHash('1'.repeat(40)), 'max length')
  t.notThrows(withHash('01234567890abcdef'), 'valid char')
})

test.serial('get range for tagged release', async t => {
  const head = 'abcdef0'

  mockExec({stdout: `${head}\n`})
  mockVersionsList()

  const range = await tag.range('1.1.2')

  t.is(range.length, 2)
  t.true(taggedVersions.getList.calledOnce)
  t.true(taggedVersions.getList.calledWithExactly('<=1.1.2'))

  const [release, parent] = range

  t.is(release.version, '1.1.2')
  t.is(parent.version, '1.1.1')
})

test.serial('get range for head commit', async t => {
  const head = 'abcdef0'

  mockExec({stdout: `${head}\n`})
  mockVersionsList()

  const range = await tag.range('1.1.3')

  t.is(range.length, 2)
  t.true(ps.exec.calledOnce)
  t.true(ps.exec.calledWithExactly('git rev-parse HEAD'))

  const [release, parent] = range

  t.is(release.hash, head)
  t.is(release.version, '1.1.3')
  t.is(parent.version, '1.1.2')
})

test.serial('should throw when initial release is missing (1/2)', t => {
  const head = 'abcdef0'

  mockExec({stdout: `${head}\n`})
  mockVersionsList([])

  t.throws(tag.range('1.1.3'), /No initial release/)
})

test.serial('should throw when initial release is missing (2/2)', t => {
  const head = 'abcdef0'

  mockExec({stdout: `${head}\n`})
  mockVersionsList(defaultList().slice(0, 1))

  t.throws(tag.range('1.1.2'), /No initial release/)
})

test.serial('should throw on invalid version', t => {
  const head = 'abcdef0'

  mockExec({stdout: `${head}\n`})
  mockVersionsList(defaultList().slice(0, 1))

  t.throws(tag.range('foo'), /Invalid version/)
})

test.serial('should throw if the head commit cannot be query', t => {
  mockExec(Promise.reject(new Error('fatal: Not a git repository (or any of the parent directories')))
  mockVersionsList(defaultList().slice(0, 1))

  t.throws(tag.range('1.1.3'), /Directory is not a Git repository/)
})

test.serial('should throw if tag list cannot be queried', t => {
  const head = 'abcdef0'

  mockExec({stdout: `${head}\n`})
  mockVersionsList(Promise.reject(new Error('fatal: Not a git repository (or any of the parent directories')))

  t.throws(tag.range('1.1.3'), /Directory is not a Git repository/)
})

test.afterEach('restore stub\'ed packages', () => {
  [ps.exec, taggedVersions.getList].filter(
    meth => typeof meth.restore === 'function'
  ).forEach(
    meth => meth.restore()
  )
})

function mockExec(result) {
  sinon.stub(ps, 'exec')
  ps.exec.returns(Promise.resolve(result))
}

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
