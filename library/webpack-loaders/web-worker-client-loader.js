const { relative } = require('path')

module.exports = WebworkerClientLoader

function WebworkerClientLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  return createClientCode({ filename })
}

function createClientCode({ filename }) {
  return `|if (!__webpack_web_worker_chunk_manifest__) throw new Error('Only import this file in a client-side webpack context')
          |module.exports = __webpack_public_path__ + __webpack_web_worker_chunk_manifest__[${JSON.stringify(filename)}].filename
          |`.split(/^[ \t]*\|/m).join('')
}
