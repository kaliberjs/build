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

      compiler.plugin('done', stats => { send('done') })
      compiler.plugin('failed', err => { send('failed') })
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
        if (client.readyState === ws.OPEN) client.send(message)
      })
    }
  }
}
