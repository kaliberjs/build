/*
  Adds a hook to the `chunk-css-hash` of the compilation to record the hashes of css chunks. These hases
  are sent when compilation completes.
*/
const ansiRegex = require('ansi-regex')

const p = 'hot-css-replacement-plugin'

module.exports = function hotCssReplacementPlugin() {

  return {
    apply: compiler => {
      let send
      let cssChunkHashes

      compiler.hooks.websocketSendAvailable.tap(p, x => { send = x })

      compiler.hooks.compilation.tap(p, compilation => {
        cssChunkHashes = {}
        compilation.hooks.chunkCssHashes.tap(p, (chunkName, cssHashes) => {
          cssChunkHashes[chunkName] = cssHashes
        })
      })
      compiler.hooks.done.tap(p, stats => {
        if (stats.hasErrors()) sendErrors(stats.toJson('errors-only').errors)
        else send({ type: 'done', hash: stats.hash, cssChunkHashes })
      })
      compiler.hooks.failed.tap(p, err => { sendErrors([err.message]) })

      function sendErrors(errors) {
        send({ type: 'failed', errors: errors.map(e => e.replace(ansiRegex(), '')) })
      }
    }
  }
}
