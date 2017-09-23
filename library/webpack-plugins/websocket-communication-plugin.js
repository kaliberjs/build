const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')
const ParserHelpers = require('webpack/lib/ParserHelpers')
const net = require('net')
const ws = require('ws')

module.exports = websocketCommunicationPlugin

function websocketCommunicationPlugin() {

  return {
    apply: compiler => {
      const freePort = findFreePort()
      const webSocketServer = freePort.then(startWebSocketServer)

      function send(message) { webSocketServer.then(wss => wss.send(message)) }

      let port

      // provide the send function
      compiler.plugin('environment', () => {
        compiler.applyPlugins('websocket-send-available', send)
      })

      // wait for a free port before we start compiling
      compiler.plugin('before-compile', (params, done) => {
        freePort.then(found => { port = found }).then(_ => { done() }).catch(done)
      })

      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {
        // make sure the __webpack_websocket_port__ is available in modules (code copied from ExtendedApiPlugin)
        compilation.dependencyFactories.set(ConstDependency, new NullFactory())
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())
        compilation.mainTemplate.plugin('require-extensions', function(source, chunk, hash) {
          const buf = [
            source,
            '',
            '// __webpack_websocket_port__',
            `${this.requireFn}.wsp = ${port};`
          ]
          return this.asString(buf)
        })
        compilation.mainTemplate.plugin('global-hash', () => true)
        normalModuleFactory.plugin('parser', (parser, parserOptions) => {
          parser.plugin(`expression __webpack_websocket_port__`, ParserHelpers.toConstantDependency('__webpack_require__.wsp'))
          parser.plugin(`evaluate typeof __webpack_websocket_port__`, ParserHelpers.evaluateToString('string'))
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
