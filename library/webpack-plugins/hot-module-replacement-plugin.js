/*
  Adds the hot module replacement plugin which provides most of the machinery for hot reloading.

  We set the `hotModuleReplacementPort` on the `context` for module loaders, this is picked up
  by the `react-universal-client-loader` and used as a signal to load the `hot-module-replacement-client`
  and accept hot reloading for that module.

  We open up a websocket that communicates when a build has finished to the `hot-module-replacement-client`
  which then instructs the hot module replacement machinery to inject the updated module.
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
