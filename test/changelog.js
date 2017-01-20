// Packages
import test from 'ava'

// Ours
import changelog from '../lib/changelog'

test('should render changes', t => {
  const changes = [{
    name: 'Major Change',
    commits: [{
      title: 'Remove foo',
      hash: '1'.repeat(40)
    }]
  }, {
    name: 'Minor Change',
    commits: [{
      title: 'Add bar',
      hash: '2'.repeat(40)
    }]
  }, {
    name: 'Patch',
    commits: [{
      title: 'Tweak baz',
      hash: '3'.repeat(40)
    }, {
      title: 'Tweak fooz',
      hash: '4'.repeat(40)
    }]
  }]
  const log = changelog.render({changes, credits: []})

  t.is(log, `### Major Change

- Remove foo #1111111

### Minor Change

- Add bar #2222222

### Patches

- Tweak baz #3333333
- Tweak fooz #4444444

`)
})

test('should render credits', t => {
  const changes = [{
    name: 'Major Change',
    commits: [{
      title: 'Remove foo',
      hash: '1'.repeat(40)
    }]
  }, {
    name: 'Patch',
    commits: [{
      title: 'Tweak baz',
      hash: '3'.repeat(40)
    }, {
      title: 'Tweak fooz',
      hash: '4'.repeat(40)
    }]
  }]
  const credits = ['bob', 'alice', 'rob']
  const log = changelog.render({changes, credits})

  t.is(log, `### Major Change

- Remove foo #1111111

### Patches

- Tweak baz #3333333
- Tweak fooz #4444444

### Credits

Huge thanks to @bob, @alice and @rob for contributing!
`)
})

test('should render credits with one contributor', t => {
  const changes = [{
    name: 'Major Change',
    commits: [{
      title: 'Remove foo',
      hash: '1'.repeat(40)
    }]
  }]
  const credits = ['bob']
  const log = changelog.render({changes, credits})

  t.is(log, `### Major Change

- Remove foo #1111111

### Credits

Huge thanks to @bob for contributing!
`)
})

test('should render credits with two contributors', t => {
  const changes = [{
    name: 'Major Change',
    commits: [{
      title: 'Remove foo',
      hash: '1'.repeat(40)
    }]
  }]
  const credits = ['bob', 'alice']
  const log = changelog.render({changes, credits})

  t.is(log, `### Major Change

- Remove foo #1111111

### Credits

Huge thanks to @bob and @alice for contributing!
`)
})

test('should throws if there are no changes', t => {
  const error = t.throws(() => changelog.render({changes: [], credits: []}))

  t.regex(error.message, /No changes/)
})
