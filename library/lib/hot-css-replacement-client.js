// maybe rename, we could reload the page as well
function hotCssReplacementClient(port, compilationHash, cssHash, chunkName) {
  console.log('Starting hot css replacement client with port', port)

  let previousCssHash = cssHash
  let previousCompilationHash = compilationHash

  const ws = new WebSocket('ws://localhost:' + port)
  ws.onopen = _ => { console.log('Waiting for signals') }
  ws.onmessage = ({ data }) => {
    const { type, hash, cssChunkHashes } = JSON.parse(data)

    switch (type) {
      case 'done':
        const cssHash = cssChunkHashes[chunkName]
        if (hash && previousCompilationHash !== hash) {
          console.log('compilation has changed - we could reload the page, this however would be a bit tricky if the change was in the js that is itself hot reloading')
          previousCompilationHash = hash
        }
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
