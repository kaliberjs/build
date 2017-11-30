/*
  Adds the hot module replacement plugin which provides most of the machinery for hot reloading.

  The only thing we do is send a message when compilation completes.
*/

const webpack = require('webpack')
const ansiRegex = require('ansi-regex')

module.exports = function hotModuleReplacementPlugin() {

  return {
    apply: compiler => {
      new webpack.HotModuleReplacementPlugin().apply(compiler)

      let send

      compiler.plugin('websocket-send-available', x => { send = x })
      compiler.plugin('done', stats => {
        if (stats.hasErrors()) sendErrors(stats.toJson('errors-only').errors)
        else send({ type: 'done', hash: stats.hash })
      })
      compiler.plugin('failed', err => { sendErrors([err.message]) })

      function sendErrors(errors) {
        send({ type: 'failed', errors: errors.map(e => e.replace(ansiRegex(), '')) })
      }
    }
  }
}
