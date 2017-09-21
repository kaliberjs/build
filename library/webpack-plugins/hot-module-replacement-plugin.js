/*
  Adds the hot module replacement plugin which provides most of the machinery for hot reloading.

  We set the `hotModuleReplacementPort` on the `context` for module loaders, this is picked up
  by the `react-universal-client-loader` and used as a signal to load the `hot-module-replacement-client`
  and accept hot reloading for that module.

  We open up a websocket that communicates when a build has finished to the `hot-module-replacement-client`
  which then instructs the hot module replacement machinery to inject the updated module.
*/

const net = require('net')
const webpack = require('webpack')
const ws = require('ws')

module.exports = function hotModuleReplacementPlugin() {
  const freePort = findFreePort()
  const webSocketServer = freePort.then(startWebSocketServer)

  function send(message) { webSocketServer.then(wss => wss.send(message)) }

  return {
    apply: compiler => {
      new webpack.HotModuleReplacementPlugin().apply(compiler)

      let port

      compiler.plugin('before-compile', (params, done) => {
        freePort.then(found => { port = found }).then(_ => { done() }).catch(done)
      })

      compiler.plugin('compilation', compilation => {
        compilation.plugin('normal-module-loader', (context, module) => {
          context.hotModuleReplacementPort = port
        })
      })

      compiler.plugin('done', stats => { send({ type: 'done', hash: stats.hash }) })
      compiler.plugin('failed', err => { send({ type: 'failed' }) })
    }
  }
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    let port
    server.on('listening', () => {
      port = server.address().port
      server.close()
    })
    server.on('close', () => { resolve(port) })
    server.on('error', (err) => { reject(err) })
    server.listen(0, 'localhost')
  })
}

function startWebSocketServer(port) {

  console.log(`WebSocket opened on port ${port}`)
  const wss = new ws.Server({ port })

  return {
    send: message => {
      wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) client.send(JSON.stringify(message))
      })
    }
  }
}
