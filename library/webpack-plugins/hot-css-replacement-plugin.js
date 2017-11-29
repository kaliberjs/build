/*
  Adds a hook to the `chunk-css-hash` of the compilation to record the hashes of css chunks. These hases
  are sent when compilation completes.
*/

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
      compiler.plugin('done', stats => { send({ type: 'done', hash: stats.hash, cssChunkHashes }) })
      compiler.plugin('failed', err => { send({ type: 'failed' }) })
    }
  }
}
