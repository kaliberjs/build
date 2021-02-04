const { relative } = require('path')

module.exports = WebworkerClientLoader

function WebworkerClientLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  return createClientCode({ filename })
}

function createClientCode({ filename }) {
  return `|const workerPath = __webpack_public_path__ +
          |  __webpack_webworker_chunk_manifest__[${JSON.stringify(filename)}].filename
          |
          |export function Worker() {
          |  return new window.Worker(workerPath)
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
