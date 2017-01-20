'use strict'

// Packages
const handlebars = require('handlebars')
const pluralize = require('pluralize')

function join(context, opts) {
  const {separator = ',', last} = opts.hash || {}
  const iterFn = typeof opts.fn === 'function' ? val => opts.fn(val) : val => val.toString()
  const list = context.map(iterFn)

  if (last === undefined) {
    return list.join(separator)
  }

  if (list.length < 3) {
    return list.join(last)
  }

  const end = list.slice(-2)
  const start = list.slice(0, -2)

  return start.concat(end.join(last)).join(separator)
}

function plural(name, {hash: {count = 0} = {}}) {
  return pluralize(name, count)
}

function slice(arr, opts) {
  const {start = 0, end} = opts.hash || {}

  return arr.slice(start, end)
}

handlebars.registerHelper('join', join)
handlebars.registerHelper('plural', plural)
handlebars.registerHelper('slice', slice)

const defaultSource = `
{{~#each changes~}}
  ### {{plural name count=commits.length}}

  {{#each commits ~}}
    - {{title}} #{{slice hash end=7}}
  {{/each}}

{{/each}}

{{~#if credits~}}
### Credits

Huge thanks to
{{~#join credits last=' and'}} @{{.}}{{/join}} for contributing!
{{/if}}
`

exports.create = function (source = defaultSource) {
  return handlebars.compile(source)
}

exports.render = function (context = {}, options = {}) {
  const {templateSource, template = exports.create(templateSource)} = options

  if (!context.changes || context.changes.length < 1) {
    throw new Error('No changes happened since the last release.')
  }

  return template(context)
}
