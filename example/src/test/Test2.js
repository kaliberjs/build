import { useWebWorker } from './test-worker?webworker'
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
  const worker = useWebWorker()
  React.useMemo(
    () => {
      worker.postMessage('from first render')
      worker.onmessage = e => setFromWorker(e.data)
    },
    [worker]
  )

  return (
    <>
      <p>From worker: {fromWorker}</p>
      <button type='button' onClick={e => worker.postMessage('from button')}>click</button>
    </>
  )
}
