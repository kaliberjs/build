// eslint-disable-next-line @kaliber/no-default-export
export default class Test2 extends Component {

  state = { message: 'unmounted' }

  render() {
    return (
      <div>
        {this.props.name}: Test2 - {this.state.message}
        <WebWorker />
      </div>
    )
  }

  componentDidMount() {
    this.setState({ message: 'mounted' })
  }

  componentWillUnmount() {
    console.log(`${this.props.name}: unmount test2`)
  }
}

function WebWorker() {
  const [fromWorker, setFromWorker] = React.useState('from first render')
  const [worker, setWorker] = React.useState(null)
  console.log('test2 worker')
  React.useEffect(
    () => {
      const currentWorker = new Worker(require('./test-worker?webworker'))
      setWorker(currentWorker)

      currentWorker.postMessage('from mount')
      currentWorker.onmessage = e => setFromWorker(e.data)

      return () => currentWorker.terminate()
    },
    []
  )

  return (
    <>
      <p>From worker: {fromWorker}</p>
      <button type='button' onClick={e => console.log('posting') || worker.postMessage('from button')}>click</button>
    </>
  )
}
