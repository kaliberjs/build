/*
  This plugin provides a websocket which can be used for communicating from plugins to a running client.

  Plugins can get hold of the `send` method by adding the following hook:

  compiler.hooks.websocketSendAvailable.tap('plugin-name', send => {
    ...
  })

  During code generation, the variable __webpack_websocket_port__ is replaced with the port number at the
  other end of the `send` method. This allows clients to open a connection to that port and listen to the
  message from `send`.
*/

const { SyncHook } = require('tapable')
const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')
const ParserHelpers = require('webpack/lib/ParserHelpers')
const net = require('net')
const ws = require('ws')

const p = 'websocket-communication-plugin'

module.exports = function websocketCommunicationPlugin() {

  return {
    apply: compiler => {
      if (compiler.hooks.websocketSendAvailable) throw new Error('Hook `websocketSendAvailable` already in use')
      compiler.hooks.websocketSendAvailable = new SyncHook(['send'])

      const freePort = findFreePort()
      const webSocketServer = freePort.then(startWebSocketServer)

      function send(message) { webSocketServer.then(wss => wss.send(message)) }

      let port

      // provide the send function
      compiler.hooks.environment.tap(p, () => {
        compiler.hooks.websocketSendAvailable.call(send)
      })

      // wait for a free port before we start compiling
      compiler.hooks.beforeCompile.tapPromise(p, params => freePort.then(found => { port = found }))

      // make sure the __webpack_websocket_port__ is available in modules (code copied from ExtendedApiPlugin)
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(ConstDependency, new NullFactory())
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())
        compilation.mainTemplate.hooks.requireExtensions.tap(p, function(source, chunk, hash) {
          const buf = [
            source,
            '',
            '// __webpack_websocket_port__',
            `${compilation.mainTemplate.requireFn}.wsp = ${port};`
          ]
          return buf.join('\n')
        })
        compilation.mainTemplate.hooks.globalHash.tap(p, () => true)
        normalModuleFactory.hooks.parser.for('javascript/auto').tap(p, addParserHooks)
        normalModuleFactory.hooks.parser.for('javascript/dynamic').tap(p, addParserHooks)

        function addParserHooks(parser, parserOptions) {
          parser.hooks.expression.for('__webpack_websocket_port__').tap(p, ParserHelpers.toConstantDependency(parser, '__webpack_require__.wsp'))
          parser.hooks.evaluateTypeof.for('__webpack_websocket_port__').tap(p, ParserHelpers.evaluateToString('string'))
        }
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
