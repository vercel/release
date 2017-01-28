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

test('tap\'ed promise reject if the cb throws', async t => {
  const src = Promise.resolve(1)
  const err = new Error()
  const cb = sinon.stub().throws(err)

  await src.then(tap(cb)).then(
    () => t.fail('unexpected'),
    e => t.is(e, err)
  )
})

test('tap\'ed promise reject if the cb reject', async t => {
  const src = Promise.resolve(1)
  const err = new Error()
  const cb = sinon.stub().returns(Promise.reject(err))

  await src.then(tap(cb)).then(
    () => t.fail('unexpected'),
    e => t.is(e, err)
  )
})

test('tap.error reject with original error', async t => {
  const err1 = new Error()
  const err2 = await t.throws(
    Promise.reject(err1)
      .catch(tap.error(() => {}))
  )

  t.is(err2, err1)
})

test('tap.error calls its callback', async t => {
  const err1 = new Error()
  const cb = sinon.spy()

  await t.throws(
    Promise.reject(err1)
      .catch(tap.error(cb))
  )

  t.true(cb.calledOnce)
  t.true(cb.calledWithExactly(err1))
})

test('tap.error promise reject with callback error if it throws', async t => {
  const err1 = new Error()
  const err2 = new Error()
  const cb = sinon.stub().throws(err2)

  const err3 = await t.throws(
    Promise.reject(err1)
      .catch(tap.error(cb))
  )

  t.is(err3, err2)
})

test('tap.error promise reject with callback rejection error', async t => {
  const err1 = new Error()
  const err2 = new Error()
  const cb = sinon.stub().returns(Promise.reject(err2))

  const err3 = await t.throws(
    Promise.reject(err1)
      .catch(tap.error(cb))
  )

  t.is(err3, err2)
})
