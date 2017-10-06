/*
  Simply replaces the css with it's new hashed name.

  In the future we could expand this to reload the static (non universal) portion of the site:
  https://github.com/kaliberjs/build/issues/64
*/
function hotCssReplacementClient(port, cssHash, chunkName) { // eslint-disable-line no-unused-vars
  console.log('Starting hot css replacement client with port', port)

  let previousCssHash = cssHash

  const ws = new WebSocket('ws://localhost:' + port)
  ws.onopen = _ => { console.log('Waiting for signals') }
  ws.onmessage = ({ data }) => {
    const { type, cssChunkHashes } = JSON.parse(data)

    switch (type) {
      case 'done':
        const cssHash = cssChunkHashes[chunkName]
        if (!cssHash || (previousCssHash === cssHash)) return
        document.querySelector(`link[href="/${previousCssHash}.css"]`).setAttribute('href', `/${cssHash}.css`)
        previousCssHash = cssHash
        break;
      case 'failed':
        console.warn('Compilation failed')
        break;
      default:
        throw new Error(`Unexpected type '${type}'`)
    }
  }
}
