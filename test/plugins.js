// Native
import path from 'path'

// Packages
import test from 'ava'
import sinon from 'sinon'

// Ours
import {create, load} from '../lib/plugins'

test('create a list of plugins', t => {
  t.is(create().length, 0)
  t.is(create({}).length, 1)
  t.is(create({}, {}).length, 2)
})

test('register append a plugin to the list', t => {
  const plugins = create()

  t.is(plugins.length, 0)
  plugins.register({})
  t.is(plugins.length, 1)
})

test('run hooks and default action', async t => {
  const p1 = {beforeFoo: sinon.spy(), afterFoo: sinon.spy()}
  const p2 = {beforeFoo: sinon.spy(), afterFoo: sinon.spy()}
  const action = {name: 'Foo', handler: sinon.spy()}
  const plugins = create(p1, p2)

  await plugins.run(action)

  t.true(p1.beforeFoo.calledOnce)
  t.true(p2.beforeFoo.calledOnce)
  t.true(action.handler.calledOnce)
  t.true(p1.afterFoo.calledOnce)
  t.true(p2.afterFoo.calledOnce)
})

test('run hooks and default action with argument', async t => {
  const p1 = {beforeFoo: sinon.spy(), afterFoo: sinon.spy()}
  const p2 = {beforeFoo: sinon.spy(), afterFoo: sinon.spy()}
  const action = {name: 'Foo', handler: sinon.spy()}
  const plugins = create(p1, p2)

  await plugins.run(action, 'foo', 'bar')

  t.true(p1.beforeFoo.calledWithExactly('foo', 'bar'))
  t.true(p2.beforeFoo.calledWithExactly('foo', 'bar'))
  t.true(action.handler.calledWithExactly('foo', 'bar'))
  t.true(p1.afterFoo.calledWithExactly('foo', 'bar'))
  t.true(p2.afterFoo.calledWithExactly('foo', 'bar'))
})

test('run "before*"" hooks before default action', async t => {
  const p1 = {beforeFoo: sinon.spy()}
  const p2 = {beforeFoo: sinon.spy()}
  const action = {name: 'Foo', handler: sinon.spy()}
  const plugins = create(p1, p2)

  await plugins.run(action)

  t.true(p1.beforeFoo.calledBefore(action.handler))
  t.true(p2.beforeFoo.calledBefore(action.handler))
})

test('run "before*"" hooks sequentially', async t => {
  const trigger = sinon.spy()
  const p1 = {beforeFoo: () => wait().then(trigger)}
  const p2 = {beforeFoo: sinon.spy()}
  const action = {name: 'Foo'}
  const plugins = create(p1, p2)

  await plugins.run(action)

  t.true(trigger.calledBefore(p2.beforeFoo))
})

test('run "before*"" hooks and default handler only if required', async t => {
  let isNeeded = true
  const p1 = {beforeFoo: sinon.spy()}
  const p2 = {beforeFoo: () => {
    isNeeded = false
  }}
  const p3 = {beforeFoo: sinon.spy()}
  const action = {name: 'Foo', handler: sinon.spy(), required: () => isNeeded}
  const plugins = create(p1, p2, p3)

  await plugins.run(action)

  t.true(p1.beforeFoo.calledOnce)
  t.false(p3.beforeFoo.called)
  t.false(action.handler.called)
})

test('run "after*" hooks after default action', async t => {
  const p1 = {afterFoo: sinon.spy()}
  const p2 = {afterFoo: sinon.spy()}
  const action = {name: 'Foo', handler: sinon.spy()}
  const plugins = create(p1, p2)

  await plugins.run(action)

  t.true(action.handler.calledBefore(p1.afterFoo))
  t.true(action.handler.calledBefore(p2.afterFoo))
})

test('run "after*" hooks if default action was not required', async t => {
  const p1 = {afterFoo: sinon.spy()}
  const p2 = {afterFoo: sinon.spy()}
  const action = {name: 'Foo', required: () => false}
  const plugins = create(p1, p2)

  await plugins.run(action)

  t.true(p1.afterFoo.calledOnce)
  t.true(p2.afterFoo.calledOnce)
})

test('load should return an empty plugin array if there is no list to load', t => {
  t.is(load().length, 0)
})

test('load should load a config module', t => {
  const config = {}
  const loader = sinon.stub().returns(config)

  t.is(load('./config', {loader})[0], config)
  t.true(loader.calledOnce)
  t.true(loader.calledWithExactly(path.resolve('./config')))
})

test('load should load a global config module', t => {
  const config = {}
  const loader = sinon.stub().returns(config)

  t.is(load('/usr/local/release/config', {loader})[0], config)
  t.true(loader.calledOnce)
  t.true(loader.calledWithExactly('/usr/local/release/config'))
})

test('load should load a plugin', t => {
  const plugin = {}
  const loader = sinon.stub().returns(plugin)

  t.is(load('foo', {loader})[0], plugin)
  t.true(loader.calledOnce)
  t.true(loader.calledWithExactly('release-plugin-foo'))
})

test('load should list of config/plugin', t => {
  const localOne = {}
  const globalOne = {}
  const plugin = {}
  const loader = sinon.stub()

  loader.withArgs(path.resolve('./config')).returns(localOne)
  loader.withArgs('/config').returns(globalOne)
  loader.withArgs('release-plugin-foo').returns(plugin)

  const plugins = load('./config:/config:foo', {loader})

  t.is(plugins[0], localOne)
  t.is(plugins[1], globalOne)
  t.is(plugins[2], plugin)
})

test('load should initiate a config/plugin functions', t => {
  const plugin = {}
  const pluginFn = sinon.stub().returns(plugin)
  const loader = sinon.stub().returns(pluginFn)
  const init = [1, 2]

  t.is(load('foo', {init, loader})[0], plugin)
  t.true(pluginFn.calledOnce)
  t.true(pluginFn.calledWithExactly(1, 2))
})

function wait(delay = 10) {
  return new Promise(resolve => setTimeout(resolve, delay))
}
