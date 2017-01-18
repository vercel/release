// Packages
import test from 'ava'
import sinon from 'sinon'

// Ours
import {tap} from '../lib/promise'

test('tap promise resolve to the original value', async t => {
  const src = Promise.resolve(1)

  t.is(await src.then(tap(() => 2)), 1)
})

test('tap call its callback with the promise value', async t => {
  const src = Promise.resolve(1)
  const cb = sinon.spy()

  await src.then(tap(cb))

  t.true(cb.calledOnce)
  t.true(cb.calledWithExactly(1))
})

test('tap promise if the cb throws', async t => {
  const src = Promise.resolve(1)
  const err = new Error()
  const cb = sinon.stub().throws(err)

  await src.then(tap(cb)).then(
    () => t.fail('unexpected'),
    e => t.is(e, err)
  )
})

test('tap promise if the cb reject', async t => {
  const src = Promise.resolve(1)
  const err = new Error()
  const cb = sinon.stub().returns(Promise.reject(err))

  await src.then(tap(cb)).then(
    () => t.fail('unexpected'),
    e => t.is(e, err)
  )
})
