/*
  This plugin provides a websocket which can be used for communicating from plugins to a running client.

  Plugins can get hold of the `send` method by adding the following hook:

  websocketCommunicationPlugin.getHooks(compiler).websocketSendAvailable.tap('plugin-name', send => {
    ...
  })

  During code generation, the variable __webpack_websocket_port__ is replaced with the port number at the
  other end of the `send` method. This allows clients to open a connection to that port and listen to the
  message from `send`.
*/

const net = require('net')
const ws = require('ws')
const { SyncHook } = require('tapable')
const { addBuiltInVariable, createGetHooks } = require('../lib/webpack-utils')

const p = 'websocket-communication-plugin'

const getHooks = createGetHooks(() => ({
  websocketSendAvailable: new SyncHook(['send'])
}))
websocketCommunicationPlugin.getHooks = getHooks

module.exports = websocketCommunicationPlugin

function websocketCommunicationPlugin() {

  return {
    apply: compiler => {
      const freePort = findFreePort()
      const webSocketServer = freePort.then(startWebSocketServer)

      function send(message) { webSocketServer.then(wss => wss.send(message)) }

      let port

      // provide the send function
      compiler.hooks.environment.tap(p, () => {
        getHooks(compiler).websocketSendAvailable.call(send)
      })

      // wait for a free port before we start compiling
      compiler.hooks.beforeCompile.tapPromise(p, params => freePort.then(found => { port = found }))

      // make sure the __webpack_websocket_port__ is available in modules
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {

        addBuiltInVariable({
          compilation, normalModuleFactory,
          pluginName: p,
          variableName: '__webpack_websocket_port__',
          abbreviation: 'wsp',
          type: 'number',
          createValue: (chunk) => port
        })
      })
    }
  }
}

function findFreePort(retries = 2) {
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
  }).catch(e => retries
    ? findFreePort(retries - 1)
    : Promise.reject(e)
  )
}

function startWebSocketServer(port) {
  const wss = new ws.Server({ port })
  wss.on('connection', ws => {
    ws.on('error', err => {
      // Ignore network errors like `ECONNRESET`, `EPIPE`, etc., fixes https://github.com/kaliberjs/build/issues/106
      if (err.errno) return
      throw err
    })
  })

  return {
    send: message => {
      wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) client.send(JSON.stringify(message))
      })
    }
  }
}
