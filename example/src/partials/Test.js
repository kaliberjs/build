import Test2 from './Test2'
import styles from './test.css'
import json from './test.json'
import firebase from 'firebase'

const extra = { x: 'x' }

export default class Test extends Component {

  state = {
    counter: 0,
    asyncValue: null,
    message: this.props.initialMessage,
    ...extra
  }

  render() {
    return (
      <div>
        {this.props.soep}
        <span className={styles.test}>{this.state.counter} - {this.state.message}</span>
        <Test2 />
        <p>asyncValue: {this.state.asyncValue}</p>
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

    import(/* webpackChunkName: "dynamicImportTest.entry.js" */ './dynamicImportTest').then(({ default: mod }) => console.log('import?', mod()))
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
