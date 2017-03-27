const { SourceMapConsumer } = require('source-map')

module.exports = {
  evalWithSourceMap,
  withSourceMappedError
}

function evalWithSourceMap(source, map) {
  return withSourceMappedError(map, () => {
    const module = { exports: {} }
    const result = eval(source)
    return module.exports 
  })
}

function withSourceMappedError(map, fn) {
  return withRawErrorStack(() => {
    try { return Promise.resolve(fn()) }
    catch (e) { return Promise.reject(new Error(e + '\n' + toMappedStack(map, e.stack))) }
  })
}

function withRawErrorStack(fn) {
  const $prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (error, stack) => stack
  try { return fn() } finally { Error.prepareStackTrace = $prepareStackTrace }
}

function toMappedStack(map, stack) {
  const sourceMap = new SourceMapConsumer(map)
  return stack
    .map(frame => {
      if (frame.isEval()) {
        const generated = { line: frame.getLineNumber(), column: frame.getColumnNumber() - 1 }
        const { source, line, column } = sourceMap.originalPositionFor(generated)
        if (source && !source.startsWith('webpack/')) return `    at ${source}:${line}:${column + 1}`
      }
    })
    .filter(Boolean)
    .join('\n')
}