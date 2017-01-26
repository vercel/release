// Packages
import test from 'ava'
import sinon from 'sinon'

// Ours
import {create} from '../lib/release'

test('set id if the release data are set', t => {
  const release = create()

  t.is(release.id, null)

  release.data = {id: 12345}
  t.is(release.id, 12345)
})

test('set name if the release data are set and has a name', t => {
  const release = create()

  t.is(release.name, null)

  release.data = {}
  t.is(release.name, null)

  release.data = {name: 'foo'}
  t.is(release.name, 'foo')
})

test('set tagName if the release tag is set', t => {
  const release = create()

  t.is(release.tagName, null)

  release.target = {tag: 'v1.0.0'}
  t.is(release.tagName, 'v1.0.0')
})

test('set targetCommitish if the release tag is set', t => {
  const release = create()

  t.is(release.targetCommitish, null)

  release.target = {hash: '1234567'}
  t.is(release.targetCommitish, '1234567')
})

test('set isDraft if the release data are set', t => {
  const release = create()

  t.is(release.isDraft, true)

  release.data = {draft: true}
  t.is(release.isDraft, true)

  release.data = {draft: false}
  t.is(release.isDraft, false)
})

test('set isPrerelease to false by default', t => {
  const release = create()

  t.is(release.isPrerelease, false)
})

test('set isPrerelease according to the pre', t => {
  const release = create()

  release.pre = true
  t.is(release.isPrerelease, true)
})

test('set isPrerelease according to the data if pre is not set', t => {
  const release = create()

  release.data = {prerelease: true}
  t.is(release.isPrerelease, true)

  release.pre = false
  t.is(release.isPrerelease, false)
})

test('set isPrerelease according to the target version if pre or data are is not set', t => {
  const release = create()

  release.target = {tag: 'v1.0.0-0', version: '1.0.0-0'}
  t.is(release.isPrerelease, true)

  release.data = {prerelease: false}
  t.is(release.isPrerelease, false)

  release.pre = false
  release.data = null
  t.is(release.isPrerelease, false)
})

test('set range if target and previous tags are set', t => {
  const release = create()

  t.throws(() => release.range)

  release.target = {tag: 'v2.1.1', version: '2.1.1', hash: '1234568'}
  t.throws(() => release.range)

  release.previous = {tag: 'v2.1.0', version: '2.1.0', hash: '1234567'}
  t.is(release.range, 'v2.1.0..1234568')
})

test('set type if target and previous tags are set', t => {
  const release = create()

  t.throws(() => release.type)

  release.target = {tag: 'v2.1.1', version: '2.1.1'}
  t.throws(() => release.type)

  release.previous = {tag: 'v2.1.0', version: '2.1.0'}
  t.is(release.type, 'patch')

  release.previous = {tag: 'v2.0.0', version: '2.0.0'}
  t.is(release.type, 'minor')

  release.previous = {tag: 'v1.0.0', version: '1.0.0'}
  t.is(release.type, 'major')
})

test('return payload', async t => {
  const release = create()

  t.throws(() => release.payload)

  release.target = {tag: 'v2.1.1', version: '2.1.1'}
  t.throws(() => release.payload)

  release.owner = 'zeit'
  release.repo = 'release'
  t.deepEqual(release.payload, {
    owner: 'zeit',
    repo: 'release',
    tag_name: 'v2.1.1',
    body: undefined,
    name: undefined,
    target_commitish: undefined,
    draft: true,
    prerelease: false
  })

  release.target.hash = '1234567'
  release.body = 'foo'
  release.data = {name: 'bar', draft: false, prerelease: true}
  t.deepEqual(release.payload, {
    owner: 'zeit',
    repo: 'release',
    tag_name: 'v2.1.1',
    body: 'foo',
    name: 'bar',
    target_commitish: '1234567',
    draft: false,
    prerelease: true
  })
})

test('open the release url', async t => {
  const opener = sinon.spy()
  const release = create()

  release.open({opener})
  t.false(opener.called)

  release.data = {
    html_url: 'https://github.com/zeit/release/releases/tag/v1.0.0'
  }
  release.open({opener})
  t.true(opener.calledOnce)
  t.true(opener.calledWithExactly('https://github.com/zeit/release/releases/tag/v1.0.0'))

  release.open({edit: true, opener})
  t.true(opener.calledTwice)
  t.true(opener.calledWithExactly('https://github.com/zeit/release/releases/edit/v1.0.0'))
})

test('load', async t => {
  const release = create()
  const client = release.client = {repos: {
    getReleases: sinon.stub()
  }}
  release.target = {tag: 'v1.0.1'}
  release.owner = 'zeit'
  release.repo = 'release'
  client.repos.getReleases.returns(Promise.resolve([{
    tag_name: 'v1.0.2',
    id: 123458
  }, {
    tag_name: 'v1.0.1',
    id: 123457
  }, {
    tag_name: 'v1.0.0',
    id: 123456
  }]))

  await release.load()
  t.is(release.id, 123457)

  release.target = {tag: 'v1.0.3'}
  await release.load()
  t.is(release.id, null)
})

test('create a new release', async t => {
  const release = create()

  release.target = {tag: 'v2.1.1', version: '2.1.1'}
  release.owner = 'zeit'
  release.repo = 'release'

  const client = release.client = {repos: {
    createRelease: sinon.stub(),
    editRelease: sinon.stub()
  }}

  client.repos.createRelease.returns(Promise.resolve({id: 2}))
  client.repos.editRelease.returns(Promise.resolve({id: 1}))

  await release.save()

  t.false(client.repos.editRelease.called)
  t.true(client.repos.createRelease.calledWithExactly({
    owner: 'zeit',
    repo: 'release',
    tag_name: 'v2.1.1',
    body: undefined,
    name: undefined,
    target_commitish: undefined,
    draft: true,
    prerelease: false
  }))
  t.is(release.id, 2)
})

test('edit an existing release', async t => {
  const release = create()

  release.target = {tag: 'v2.1.1', version: '2.1.1'}
  release.owner = 'zeit'
  release.repo = 'release'
  release.data = {id: 1, draft: false, prerelease: true}

  const client = release.client = {repos: {
    createRelease: sinon.stub(),
    editRelease: sinon.stub()
  }}

  client.repos.createRelease.returns(Promise.resolve({id: 2}))
  client.repos.editRelease.returns(Promise.resolve({id: 1}))

  await release.save()

  t.false(client.repos.createRelease.called)
  t.true(client.repos.editRelease.calledWithExactly({
    owner: 'zeit',
    repo: 'release',
    tag_name: 'v2.1.1',
    body: undefined,
    name: undefined,
    target_commitish: undefined,
    draft: false,
    prerelease: true,
    id: 1
  }))
  t.is(release.id, 1)
})
