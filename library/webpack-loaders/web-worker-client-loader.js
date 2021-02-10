const { relative } = require('path')

module.exports = WebworkerClientLoader

function WebworkerClientLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  return createClientCode({ filename })
}

function createClientCode({ filename }) {
  return `|export function useWebWorker() {
          |  const workerRef = React.useRef(createProxy())
          |  React.useEffect(
          |    () => {
          |      const workerPath = __webpack_public_path__ +
          |        __webpack_web_worker_chunk_manifest__[${JSON.stringify(filename)}].filename
          |      const worker = new window.Worker(workerPath)
          |      const { pending } = workerRef.current
          |      pending.forEach(({ type, ...info }) => {
          |        if (type === 'call') worker[info.method](...info.args)
          |        if (type === 'set') worker[info.prop] = info.value
          |      })
          |      workerRef.current.target = worker
          |      return () => { worker.terminate() }
          |    },
          |    []
          |  )
          |
          |  return workerRef.current
          |}
          |
          |function createProxy() {
          |  const simpleHandler = {
          |    get(target, prop) { return target[prop].bind(target) },
          |    set(target, prop, value) { target[prop] = value }
          |  }
          |
          |  const ref = {
          |    current: {
          |      target: { pending: [] },
          |      handler: {
          |        get(target, prop) {
          |          if (prop === 'pending') return target.pending
          |
          |          return new Proxy(() => {}, {
          |            apply(_, __, args) {
          |              target.pending.push({ type: 'call', method: prop, args })
          |            }
          |          })
          |        },
          |        set(target, prop, value) {
          |          if (prop === 'target') ref.current = { target: value, handler: simpleHandler }
          |          else target.pending.push({ type: 'set', prop, value })
          |          return true
          |        },
          |      }
          |    }
          |  }
          |
          |  return new Proxy(
          |    ref.current.target,
          |    new Proxy({}, {
          |      get(_, prop) {
          |        return (_, ...args) => ref.current.handler[prop](ref.current.target, ...args)
          |      }
          |    })
          |  )
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
