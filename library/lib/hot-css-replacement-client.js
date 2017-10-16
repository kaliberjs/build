/*
  Simply replaces the css with it's new hashed name.

  In the future we could expand this to reload the static (non universal) portion of the site:
  https://github.com/kaliberjs/build/issues/64
*/
function hotCssReplacementClient(port, cssHashes, chunkName, publicPath) { // eslint-disable-line no-unused-vars
  console.log('Starting hot css replacement client with port', port)

  let previousCssHashes = cssHashes

  const ws = new WebSocket('ws://localhost:' + port)
  ws.onopen = _ => { console.log('Waiting for signals') }
  ws.onmessage = ({ data }) => {
    const { type, cssChunkHashes } = JSON.parse(data)

    switch (type) {
      case 'done':
        const cssHashes = cssChunkHashes[chunkName] || []

        cssHashes.forEach((cssHash, index) => {
          const previousCssHash = previousCssHashes[index]
          if (!cssHash || (previousCssHash === cssHash)) return
          document.querySelector(`link[href="${publicPath + previousCssHash}.css"]`).setAttribute('href', `${publicPath + cssHash}.css`)
        })

        previousCssHashes = cssHashes

        break;
      case 'failed':
        console.warn('Compilation failed')
        break;
      default:
        throw new Error(`Unexpected type '${type}'`)
    }
  }
}
