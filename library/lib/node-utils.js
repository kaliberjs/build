const { SourceMapConsumer } = require('source-map')

module.exports = {
  evalWithSourceMap,
  withSourceMappedError
}

function evalWithSourceMap(source, createMap) {
  return withSourceMappedError(createMap, () => {
    const module = { exports: {} }
    eval(source) // eslint-disable-line no-eval
    return module.exports.default || module.exports
  }, { evalOnly: true })
}

function withSourceMappedError(createMap, fn, options) {
  return withRawErrorStack(() => {
    try {
      return fn()
    } catch (e) { throw new Error(e + '\n' + toMappedStack(createMap, e.stack, options)) }
  })
}

function withRawErrorStack(fn) {
  const $prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (error, stack) => stack
  try { return fn() } finally { Error.prepareStackTrace = $prepareStackTrace }
}

function toMappedStack(createMap, stack = [], { evalOnly = false } = {}) {
  const sourceMap = new SourceMapConsumer(createMap())
  return stack
    .map(frame => {
      if (evalOnly && !frame.isEval()) return null

      const [frameLine, frameColumn] = [frame.getLineNumber(), frame.getColumnNumber()]
      if (!frameLine || !frameColumn) return `    at ${frame.getFileName()}:${frameLine}:${frameColumn}`

      const generated = { line: frameLine, column: frameColumn - 1 }
      const { source, line, column } = sourceMap.originalPositionFor(generated)
      return (source && !source.startsWith('webpack/'))
        ? `    at ${source}:${line}:${column + 1}`
        : null
    })
    .filter(Boolean)
    .join('\n')
}
