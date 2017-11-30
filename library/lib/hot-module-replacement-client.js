/* global __webpack_websocket_port__, __webpack_websocket_port__, __webpack_hash__ */

const ansiRegex = require('ansi-regex')

console.log('Starting hot module reload client with port', __webpack_websocket_port__)
const ws = new WebSocket('ws://localhost:' + __webpack_websocket_port__)

ws.onopen = _ => { console.log('Waiting for signals') }
ws.onmessage = ({ data }) => {
  const { type, hash, errors } = JSON.parse(data)

  switch (type) {
    case 'done':
      if (!hash || __webpack_hash__ === hash) return
      module.hot.check(false)
        .then(updatedModules => {
          if (!updatedModules) { /* no updates */ }

          module.hot.apply({
            ignoreErrored: true,
            onErrored: ({ error }) => { logErrorWithoutColors(error) }
          }).then(renewedModules => {
              const ignoredModules = updatedModules.filter(x => !renewedModules.includes(x))
              if (ignoredModules.length) console.warn('Ignored modules: ' + ignoredModules.join(', '))
            })
            .catch(err => {
              console.error('Error during hot reload apply')
              logErrorWithoutColors(err)
            })
        })
        .catch(err => {
          console.error('Problem checking for hot reload updates')
          logErrorWithoutColors(err)
        })
      break;
    case 'failed':
      errors.forEach(error => console.error(error))
      break;
    default:
      throw new Error(`Unexpected type '${type}'`)
  }
}

function logErrorWithoutColors(error) {
  error.message = error.message.replace(ansiRegex(), '')
  console.error(error)
}
