const node = require('eslint-import-resolver-node')
const pkgDir = require('pkg-dir')
const path = require('path')

const modifiers = [
  function removeQueryString(source, file, config) {
    const newSource = source.split('?')
    return newSource
  },
  function absoluteImport(source, file, config) {
    if (!source.startsWith('/')) return source

    const paths = Array.isArray(config.path) ? config.path : [config.path]
    return paths.map(x => path.resolve(pkgDir.sync(file), x, '.' + source))
  }
]

module.exports = {
  interfaceVersion: 2,
  resolve
}

function resolve(source, file, config) {
  const possibleSources = modifiers.reduce(
    (input, modify) => input.reduce(
      (result, x) => result.concat(modify(x, file, config)),
      []
    ),
    [source]
  )
  return possibleSources.reduce(
    (result, possibleSource) => result.found
      ? result
      : node.resolve(possibleSource, file, config),
    { found: false }
  )
}
