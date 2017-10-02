/*
  Adds the hot module replacement plugin which provides most of the machinery for hot reloading.

  The only thing we do is send a message when compilation completes.
*/

const webpack = require('webpack')

module.exports = function hotModuleReplacementPlugin() {

  return {
    apply: compiler => {
      new webpack.HotModuleReplacementPlugin().apply(compiler)

      let send

      compiler.plugin('websocket-send-available', x => { send = x })
      compiler.plugin('done', stats => { send({ type: 'done', hash: stats.hash }) })
      compiler.plugin('failed', err => { send({ type: 'failed' }) })
    }
  }
}
