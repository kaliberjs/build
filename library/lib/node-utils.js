const { SourceMapConsumer } = require('source-map')
const path = require('path')
const childProcess = require('child_process')

const mappableError = Symbol('mappableError')

changeStackTraceBehavior()

const sourceMapInfo = new Map()

module.exports = {
  evalWithSourceMap,
  withSourceMappedError,
  withSourceMappedErrorAsync,
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
  try { return fn() } catch (e) {
    e[mappableError] = { createMap, options }
    throw e
  }
}

async function withSourceMappedErrorAsync(createMap, fn, options) {
  addToSourceMapInfo(captureStack().slice(1) /* ignore current method */, { createMap, options })
  try { return await fn() } catch (e) {
    e[mappableError] = { createMap, options }
    throw e
  }
}

function addToSourceMapInfo(stack, { createMap, options }) {
  /*
    We should add some form of branching. It might be that multiple stacks have the same entry points.
  */
  if (!stack.length) return
  if (stack.length > 1) {
    const [next, current] = stack.slice(-2)
    sourceMapInfo.set(current.toString(), { next: next.toString() } )
    addToSourceMapInfo(stack.slice(0, -1), { createMap, options })
  } else {
    const [current] = stack
    sourceMapInfo.set(current.toString(), { info: { createMap, options } } )
  }
}

function changeStackTraceBehavior() {
  Error.stackTraceLimit = Infinity
  Error.prepareStackTrace = (error, stack) => {
    const info = error[mappableError]
    const found = !info && findInSourceMapInfo(stack)

    if (!info && !found) return `${error.message}\n  ${stack.join('\n  ')}`

    console.log({ found: Boolean(found), info: Boolean(info) })

    const { createMap, options } = info || found
    return error.message + '\n' + toMappedStack(createMap, stack, options)
  }
}

function findInSourceMapInfo(originalStack) {
  const stack = originalStack.slice().reverse()
  let next = null
  for (let currentStack of stack) {
    const current = currentStack.toString()

    if (next && next !== current) return
    if (!sourceMapInfo.has(current)) return

    const x = sourceMapInfo.get(current)
    if (x.info) return x.info
    next = x.next
  }
}

function captureStack() {
  const x = new Error('capture')
  const $prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (error, stack) => stack
  Error.captureStackTrace(x)
  const { stack } = x
  Error.prepareStackTrace = $prepareStackTrace

  return stack.slice(1) // ignore this method
}

async function evalInFork(source, map) {
  return new Promise((resolve, reject) => {
    const js = childProcess.fork(
      path.join(__dirname, 'eval-in-fork.js'),
      [],
      { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }
    )
    const outData = []
    const errData = []
    const messageData = []
    js.on('message', x => messageData.push(x))
    js.stdout.on('data', x => outData.push(x))
    js.stderr.on('data', x => errData.push(x))
    js.on('close', code => {
      if (outData.length) console.log(outData.join(''))
      if (code === 0) {
        if (!messageData.length) reject(new Error('Execution failed, no result from eval'))
        else resolve(messageData.join(''))
      } else reject(new Error(errData.join('')))
    })
    js.send(source)
    js.send(map)
  })
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
