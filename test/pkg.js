// Packages
import test from 'ava'

// Ours
import pkg from '../lib/pkg'

const PWD = process.cwd()

test.afterEach(() => {
  process.chdir(PWD)
})

test.serial('load package in current working directory', async t => {
  const ava = await pkgFrom('./node_modules/ava')

  t.is(ava.name, 'ava')
})

test.serial('loading missing package should throws', t => {
  t.throws(pkgFrom('./test'), /Failed to package\.json/)
})

async function pkgFrom(dir = '.') {
  process.chdir(dir)

  return pkg.read()
}
