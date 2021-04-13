// eslint-disable-next-line @kaliber/no-default-export
export default class Test2 extends Component {

  state = { message: 'unmounted', messageFromWorker: 'no message' }

  render() {
    return (
      <div>
        Test2 - {this.state.message}
        <WebWorker />
      </div>
    )
  }

  componentDidMount() {
    this.setState({ message: 'mounted' })
  }
}

function WebWorker() {
  const [fromWorker, setFromWorker] = React.useState('from server render')
  const [worker, setWorker] = React.useState(null)

  React.useEffect(() => {
    const currentWorker = new Worker(require('./test-worker?webworker'))
    setWorker(currentWorker)

    currentWorker.postMessage('from first render')
    currentWorker.onmessage = e => setFromWorker(e.data)

    return () => currentWorker.terminate()
  }, [])

  return (
    <>
      <p>From worker: {fromWorker}</p>
      <button type='button' onClick={e => worker.postMessage('from button')}>click</button>
    </>
  )
}
