const { SourceMapConsumer } = require('source-map')

module.exports = {
  evalWithSourceMap,
  withSourceMappedError
}

function evalWithSourceMap (source, createMap) {
  return withSourceMappedError(createMap, () => {
    const module = { exports: {} }
    eval(source)
    return module.exports.default || module.exports
  }, { evalOnly: true })
}

function withSourceMappedError (createMap, fn, options) {
  return withRawErrorStack(() => {
    try { return fn() } catch (e) { throw new Error(e + '\n' + toMappedStack(createMap, e.stack, options)) }
  })
}

function withRawErrorStack (fn) {
  const $prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (error, stack) => stack
  try { return fn() } finally { Error.prepareStackTrace = $prepareStackTrace }
}

function toMappedStack (createMap, stack, { evalOnly = false } = {}) {
  const sourceMap = new SourceMapConsumer(createMap())
  return stack
    .map(frame => {
      if (evalOnly && !frame.isEval()) return
      const generated = { line: frame.getLineNumber(), column: frame.getColumnNumber() - 1 }
      const { source, line, column } = sourceMap.originalPositionFor(generated)
      if (source && !source.startsWith('webpack/')) return `    at ${source}:${line}:${column + 1}`
    })
    .filter(Boolean)
    .join('\n')
}
