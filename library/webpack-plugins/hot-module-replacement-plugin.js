/*
  Adds the hot module replacement plugin which provides most of the machinery for hot reloading.

  The only thing we do is send a message when compilation completes.
*/

const ansiRegex = require('ansi-regex')
const webpack = require('webpack')

const p = 'hot-module-replacement-plugin'

module.exports = function hotModuleReplacementPlugin() {

  return {
    apply: compiler => {
      new webpack.HotModuleReplacementPlugin().apply(compiler)

      let send

      compiler.hooks.websocketSendAvailable.tap(p, x => { send = x })
      compiler.hooks.done.tap(p, stats => {
        if (stats.hasErrors()) sendErrors(stats.toJson('errors-only').errors)
        else send({ type: 'done', hash: stats.hash })
      })
      compiler.hooks.failed.tap(p, err => { sendErrors([err.message]) })

      function sendErrors(errors) {
        send({ type: 'failed', errors: errors.map(e => e.replace(ansiRegex(), '')) })
      }
    }
  }
}
