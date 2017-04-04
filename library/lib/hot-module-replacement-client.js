
export default port => {
  console.log('Starting hot module reload client with port', port)
  const ws = new WebSocket('ws://localhost:' + port)

  ws.onopen = _ => { console.log('Waiting for signals') }
  ws.onmessage = event => {
    switch (event.data) {
      case 'done':
        module.hot.check(true)
        break;
      case 'failed':
        console.warning('Compilation failed')
        break;
    }
  }
}
