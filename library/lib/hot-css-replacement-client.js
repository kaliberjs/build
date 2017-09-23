/*
  Simply replaces the css with it's new hashed name.

  In the future we could expand this to reload the static (non universal) portion of the site:
  https://github.com/kaliberjs/build/issues/64
*/
function hotCssReplacementClient(port, cssHash, chunkName) {
  console.log('Starting hot css replacement client with port', port)

  let previousCssHash = cssHash

  const ws = new WebSocket('ws://localhost:' + port)
  ws.onopen = _ => { console.log('Waiting for signals') }
  ws.onmessage = ({ data }) => {
    const { type, cssChunkHashes } = JSON.parse(data)

    switch (type) {
      case 'done':
        const cssHash = cssChunkHashes[chunkName]
        if (!cssHash || previousCssHash === cssHash) return
        document.querySelectorAll(`link[rel="stylesheet"]`).forEach(el => {
          const href = el.getAttribute('href')
          if (!href.startsWith('http')) {
            const replacement = href.replace(previousCssHash, cssHash)
            el.setAttribute('href', replacement)
          }
        })
        previousCssHash = cssHash
        break;
      case 'failed':
        console.warn('Compilation failed')
        break;
    }
  }
}
