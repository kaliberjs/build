const { SourceMapConsumer } = require('source-map')
const path = require('path')
const childProcess = require('child_process')

module.exports = {
  evalWithSourceMap,
  withSourceMappedError,
  evalInFork,
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

async function evalInFork(source, map) {
  return new Promise((resolve, reject) => {
    const js = childProcess.fork(
      path.join(__dirname, 'eval-in-fork.js'),
      [source, JSON.stringify(map)],
      { silent: true }
    )
    const outData = []
    const errData = []
    js.stdout.on('data', x => outData.push(x))
    js.stderr.on('data', x => errData.push(x))

    js.on('close', code => {
      if (code === 0) resolve(outData.join(''))
      else reject(new Error(errData.join('')))
    })
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
