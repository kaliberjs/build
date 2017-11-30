/*
  Adds a hook to the `chunk-css-hash` of the compilation to record the hashes of css chunks. These hases
  are sent when compilation completes.
*/
const ansiRegex = require('ansi-regex')

module.exports = function hotCssReplacementPlugin() {

  return {
    apply: compiler => {
      let send
      let cssChunkHashes

      compiler.plugin('websocket-send-available', x => { send = x })

      compiler.plugin('compilation', compilation => {
        cssChunkHashes = {}
        compilation.plugin('chunk-css-hashes', (chunkName, cssHashes) => {
          cssChunkHashes[chunkName] = cssHashes
        })
      })
      compiler.plugin('done', stats => {
        if (stats.hasErrors()) sendErrors(stats.toJson('errors-only').errors)
        else send({ type: 'done', hash: stats.hash, cssChunkHashes })
      })
      compiler.plugin('failed', err => { sendErrors([err.message]) })

      function sendErrors(errors) {
        send({ type: 'failed', errors: errors.map(e => e.replace(ansiRegex(), '')) })
      }
    }
  }
}
