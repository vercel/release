#!/usr/bin/env node

const nodeVersion = process.version[1]

if (!nodeVersion >= 7) {
  throw new Error('This package requires at least node v7. Please upgrade!')
}
