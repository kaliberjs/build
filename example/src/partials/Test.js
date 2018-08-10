import Test2 from './Test2'
import styles from './test.css'
import json from './test.json'
import firebase from 'firebase'
import shared from './shared'
import img from '/bg2.jpg'
import Sticky from 'react-stickynode'
const extra = { x: 'x' }

export default class Test extends Component {

  static message = 'Works!'

  state = {
    counter: 0,
    asyncValue: null,
    message: this.props.initialMessage,
    ...extra
  }

  render() {
    return (
      <div>
        <img src={img} />
        <Sticky enabled top={50} bottomBoundary={1200}>
          <p>I am compiled with babel!</p>
        </Sticky>
        {this.props.soep}
        <span className={styles.test}>{this.state.counter} - {this.state.message}</span>
        <Test2 />
        <p>asyncValue: {this.state.asyncValue}</p>
        <br />
        {shared}
        <br />
        <p>Client config:</p>
        <pre>{JSON.stringify(this.props.clientConfig, null, 2)}</pre>
      </div>
    )
  }

  componentDidMount() {
    let app
    try { app = firebase.app() } catch (e) {
      app = firebase.initializeApp(this.props.clientConfig.firebase)
    }
    this.messageRef = app.database().ref('read-only').child('message')
    this.messageRef.on('value', snap => this.setState({ message: snap.val() }))

    console.log(this.state)
    console.log(json)
    console.log(new (getDecorator())().x)
    this.asyncFunction()
    this.interval = setInterval(() => this.setState(({ counter }) => ({ counter: counter + 1 })), 1000)

    import('./dynamicImportTestFunction').then(({ default: test }) => console.log('import? ' + test()))
  }

  componentWillUnmount() {
    this.messageRef.off()
    clearInterval(this.interval)
  }

  async asyncFunction () {
    const asyncValue = await new Promise(resolve => setTimeout(() => resolve('Resolved!'), 1000))
    this.setState({ asyncValue })
  }
}

function getDecorator() {
  return @decorator class Check {}

  function decorator(Class) {
    return class Decorator { x = 'a decorator' }
  }
}
