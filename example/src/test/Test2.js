import { Worker } from './test-worker?webworker'
// eslint-disable-next-line @kaliber/no-default-export
export default class Test2 extends Component {

  state = { message: 'unmounted', messageFromWorker: 'no message' }

  render() {
    return (
      <div>
        Test2 - {this.state.message} - {this.state.messageFromWorker}
        <button
          type='button'
          onClick={() => this.worker.postMessage('hallo')}
        >
          Send to worker
        </button>
      </div>
    )
  }

  componentDidMount() {
    this.setState({ message: 'mounted' })
    this.worker = new Worker()
    this.worker.onmessage = event => {
      this.setState({ messageFromWorker: JSON.stringify(event.data) })
    }
  }
}
