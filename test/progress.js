// Packages
import test from 'ava'
import sinon from 'sinon'

// Ours
import {create} from '../lib/progress'

function spinner({text}) {
  const spinner = {
    text,
    running: false,
    state: null,

    start() {
      this.running = true

      return this
    },

    stop() {
      this.running = false

      return this
    },

    succeed() {
      this.running = false
      this.state = true

      return this
    },

    fail() {
      this.running = false
      this.state = false

      return this
    }

  }

  sinon.spy(spinner, 'start')
  sinon.spy(spinner, 'stop')
  sinon.spy(spinner, 'succeed')
  sinon.spy(spinner, 'fail')

  return spinner
}

function colors() {
  const colors = {}

  for (const color of ['red', 'yellow', 'green', 'cyan']) {
    colors[color] = str => `[${color}]${str}[/${color}]`
  }

  return colors
}

function createProgress() {
  return create({spinner, stream: {write: sinon.spy()}, colors: colors()})
}

test('starts a spinner when adding a task', t => {
  const progress = createProgress()

  progress.add('foo')

  t.true(progress.spinner.running)
  t.is(progress.spinner.text, 'foo')
})

test('`add()` returns a function to dequeue a task', t => {
  const progress = createProgress()
  const [succeed] = progress.add('foo')
  const spinner = progress.spinner

  t.true(spinner.running)
  succeed()
  t.false(spinner.running)

  t.not(progress.spinner, spinner)
  t.true(spinner.succeed.calledOnce)
})

test('`add()` success handler should pass the original val', async t => {
  const progress = createProgress()
  const [succeed] = progress.add('foo')
  const result = await succeed('foo')

  t.is(result, 'foo')
})

test('`add()` returns a function to dequeue a task as failure', t => {
  const progress = createProgress()
  const [_, fail] = progress.add('foo')
  const spinner = progress.spinner

  t.true(spinner.running)
  fail().catch(() => {})
  t.false(spinner.running)

  t.not(progress.spinner, spinner)
  t.true(spinner.fail.calledOnce)
})

test('`add()` failure handler should reject with original error', async t => {
  const progress = createProgress()
  const [_, fail] = progress.add('foo')
  const err1 = new Error()
  const err2 = await t.throws(fail(err1))

  t.is(err1, err2)
})

test('pauses the spinner', t => {
  const progress = createProgress()

  progress.add('foo')
  progress.pause()

  t.false(progress.spinner.running)
  t.is(progress.spinner.text, 'foo')
})

test('writes a message when pausing the spinner', t => {
  const progress = createProgress()

  progress.add('foo')
  progress.pause('bar')

  t.true(progress.stream.write.calledOnce)
  t.true(progress.stream.write.calledAfter(progress.spinner.stop))
  t.true(progress.stream.write.calledWithExactly('bar\n'))
  t.is(progress.spinner.text, 'foo')
})

test('restarts the spinner when a task is a pending', t => {
  const progress = createProgress()

  progress.add('foo')
  t.false(progress.pause().spinner.running)
  t.true(progress.restart().spinner.running)
})

test('clears pending task', t => {
  const progress = createProgress()

  progress.add('foo')
  progress.add('bar')
  t.falsy(progress.clear().spinner.running)
})

test('logs message', t => {
  const progress = createProgress()

  progress.add('foo')
  progress.log('bar')

  t.true(progress.stream.write.calledOnce)
  t.true(progress.stream.write.calledAfter(progress.spinner.stop))
  t.true(progress.stream.write.calledWithExactly('bar\n'))
  t.is(progress.spinner.text, 'foo')
})

test('logs info message', t => {
  const progress = createProgress()

  progress.add('foo')
  progress.info('bar')

  t.true(progress.stream.write.calledOnce)
  t.true(progress.stream.write.calledAfter(progress.spinner.stop))
  t.deepEqual(progress.stream.write.lastCall.args, ['[cyan]  bar[/cyan]\n'])
  t.is(progress.spinner.text, 'foo')
})

test('logs warning message', t => {
  const progress = createProgress()

  progress.add('foo')
  progress.warn('bar')

  t.true(progress.stream.write.calledOnce)
  t.true(progress.stream.write.calledAfter(progress.spinner.stop))
  t.deepEqual(progress.stream.write.lastCall.args, ['[yellow]  bar[/yellow]\n'])
  t.is(progress.spinner.text, 'foo')
})

test('logs error message', t => {
  const progress = createProgress()

  progress.add('foo')
  progress.error('bar')

  t.true(progress.stream.write.calledOnce)
  t.true(progress.stream.write.calledAfter(progress.spinner.stop))
  t.deepEqual(progress.stream.write.lastCall.args, ['[red]  bar[/red]\n'])
  t.is(progress.spinner.text, 'foo')
})

test('logs successful task', t => {
  const progress = createProgress()

  progress.add('foo')

  const spinner = progress.spinner

  progress.succeed('foo')

  t.falsy(progress.spinner.running)
  t.true(spinner.succeed.calledOnce)
})

test('logs failed task', t => {
  const progress = createProgress()

  progress.add('foo')

  const spinner = progress.spinner

  progress.fail('foo')

  t.falsy(progress.spinner.running)
  t.true(spinner.fail.calledOnce)
})

test('report next task in queue when current one stops', t => {
  const progress = createProgress()

  progress.add('foo')
  progress.add('bar')
  progress.add('baz')
  progress.succeed('foo')

  t.true(progress.spinner.running)
  t.is(progress.spinner.text, 'baz')
})

test('wraps promise handlers', async t => {
  const progress = createProgress()
  const input = {}
  const handler = async val => {
    return Object.assign(val, {foo: 'bar'})
  }
  const wrapped = progress.wrap(handler, 'foo')
  const task = wrapped(input)
  const spinner = progress.spinner

  t.true(spinner.running)

  const output = await task

  t.is(output, input)
  t.is(input.foo, 'bar')

  t.falsy(progress.spinner.running)
  t.false(spinner.running)
  t.true(spinner.succeed.calledOnce)
})

test('wraps rejecting promise handlers', async t => {
  const progress = createProgress()
  const err1 = new Error()
  const handler = async () => {
    throw err1
  }
  const wrapped = progress.wrap(handler, 'foo')
  const task = wrapped()
  const spinner = progress.spinner

  t.true(spinner.running)

  const err2 = await t.throws(task)

  t.is(err2, err1)

  t.falsy(progress.spinner.running)
  t.false(spinner.running)
  t.true(spinner.fail.calledOnce)
})
