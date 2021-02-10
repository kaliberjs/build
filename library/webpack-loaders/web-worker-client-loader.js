const { relative } = require('path')

module.exports = WebworkerClientLoader

function WebworkerClientLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  return createClientCode({ filename })
}

function createClientCode({ filename }) {
  return `|export function useWebWorker() {
          |  const workerRef = React.useRef(createSimpleCaptureProxy())
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
          |      workerRef.current = worker
          |      return () => { worker.terminate() }
          |    },
          |    []
          |  )
          |
          |  return workerRef.current
          |}
          |
          |function createSimpleCaptureProxy() {
          |  return new Proxy({ pending: [] }, {
          |    get(target, prop) {
          |      if (prop === 'pending') return target.pending
          |
          |      return new Proxy(() => {}, {
          |        apply(_, __, args) {
          |          target.pending.push({ type: 'call', method: prop, args })
          |        }
          |      })
          |    },
          |    set(target, prop, value) {
          |      target.pending.push({ type: 'set', prop, value })
          |      return true
          |    },
          |  })
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
