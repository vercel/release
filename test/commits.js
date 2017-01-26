// Packages
import test from 'ava'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import streamify from 'stream-array'

proxyquire.noPreserveCache()

function importCommits() {
  const gitCommits = sinon.stub()
  const commits = proxyquire('../lib/commits', {
    'git-commits': gitCommits
  })

  gitCommits.returns(streamify([]))

  return {commits, gitCommits}
}

test('should resolve to an array of promise', async t => {
  const commitList = [{hash: '1234567'}, {hash: '1234568'}]
  const {commits, gitCommits} = importCommits()

  gitCommits.returns(streamify(commitList))

  t.deepEqual(await commits(), commitList)
})

test('should query commits from HEAD by default', async t => {
  const {commits, gitCommits} = importCommits()

  await commits({gitDir: '.git/'})

  t.true(gitCommits.calledOnce)
  t.true(gitCommits.calledWithExactly('.git/', {rev: 'HEAD'}))
})

test('can query for an other revision range', async t => {
  const {commits, gitCommits} = importCommits()

  await commits({gitDir: '.git/', rev: 'v1.0.0..v1.0.1'})

  t.true(gitCommits.calledOnce)
  t.true(gitCommits.calledWithExactly('.git/', {rev: 'v1.0.0..v1.0.1'}))
})

test('can map for an other revision range', async t => {
  const commitList = [{hash: '1234567'}, {hash: '1234568'}, {hash: '1234569'}]
  const {commits, gitCommits} = importCommits()
  let count = 0

  function mapper(commit) {
    count += 1

    // the mapper can filter commits by returning null or undefined
    if (count <= 2) {
      return null
    }

    return Object.assign(commit, {count})
  }

  gitCommits.returns(streamify(commitList))

  t.deepEqual(await commits({mapper}), [{hash: '1234569', count: 3}])
})

test('can map with async mapper', async t => {
  const commitList = [{hash: '1234567'}, {hash: '1234568'}, {hash: '1234569'}]
  const {commits, gitCommits} = importCommits()
  let count = 0

  function mapper(commit) {
    count += 1

    // the mapper can filter commits by returning null or undefined
    if (count <= 2) {
      return null
    }

    return Promise.resolve(Object.assign(commit, {count}))
  }

  gitCommits.returns(streamify(commitList))

  t.deepEqual(await commits({mapper}), [{hash: '1234569', count: 3}])
})

test('reject if a mapper throws', async t => {
  const commitList = [{hash: '1234567'}, {hash: '1234568'}, {hash: '1234569'}]
  const {commits, gitCommits} = importCommits()
  const err1 = new Error()

  function mapper() {
    throw err1
  }

  gitCommits.returns(streamify(commitList))

  const err2 = await t.throws(commits({mapper}))

  t.is(err2, err1)
})

test('reject if a mapper reject', async t => {
  const commitList = [{hash: '1234567'}, {hash: '1234568'}, {hash: '1234569'}]
  const {commits, gitCommits} = importCommits()
  const err1 = new Error()

  function mapper() {
    return Promise.reject(err1)
  }

  gitCommits.returns(streamify(commitList))

  const err2 = await t.throws(commits({mapper}))

  t.is(err2, err1)
})
