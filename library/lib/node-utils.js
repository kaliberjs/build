const { SourceMapConsumer } = require('source-map')

module.exports = {
  evalWithSourceMap,
  withSourceMappedError
}

function evalWithSourceMap(source, createMap) {
  return withSourceMappedError(createMap, () => {
    const module = { exports: {} }
    const result = eval(source)
    return module.exports.default || module.exports
  })
}

function withSourceMappedError(createMap, fn) {
  return withRawErrorStack(() => {
    try { return fn() }
    catch (e) { throw new Error(e + '\n' + toMappedStack(createMap, e.stack)) }
  })
}

function withRawErrorStack(fn) {
  const $prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (error, stack) => stack
  try { return fn() } finally { Error.prepareStackTrace = $prepareStackTrace }
}

function toMappedStack(createMap, stack) {
  const sourceMap = new SourceMapConsumer(createMap())
  return stack
    .map(frame => {
      const generated = { line: frame.getLineNumber(), column: frame.getColumnNumber() - 1 }
      const { source, line, column } = sourceMap.originalPositionFor(generated)
      if (source && !source.startsWith('webpack/')) return `    at ${source}:${line}:${column + 1}`
    })
    .filter(Boolean)
    .join('\n')
}