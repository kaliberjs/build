import { useEffect } from 'react'
import Test2 from './Test2'
import styles from './test.css'
import json from './test.json'
import shared from './shared'
import img from '/bg2.jpg'
import Sticky from 'react-stickynode'
import firebase from 'firebase/app'
import 'firebase/database'
import { testCalc } from '/partials/values.css'
import checkIgnoreString from '/rollbarCheckIgnore.raw'
import testString from './test.raw.txt'

const extra = { x: 'x' }

// eslint-disable-next-line @kaliber/no-default-export
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
      <>
        <img src={img} />
        <Sticky>
          <p>I am compiled with babel!</p>
        </Sticky>
        <pre>
          {testString}
          {checkIgnoreString}
        </pre>
        <Hooks foo={this.state.counter} />
        {this.props.soep}
        <span className={styles.test}>{this.state.counter} - {this.state.message}</span>
        <Test2 />
        <p>asyncValue: {this.state.asyncValue}</p>
        <br />
        {shared}
        <br />
        {!Boolean(this.state.counter % 2) && 'blink'}
        -
        {Boolean(this.state.counter % 2) && <b>blink</b>}
        <p>Client config:</p>
        <pre>{JSON.stringify(this.props.clientConfig, null, 2)}</pre>
      </>
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
    console.log('The following value should be -1rem:', testCalc)
    this.asyncFunction()
    this.interval = setInterval(() => this.setState(({ counter }) => ({ counter: counter + 1 })), 1000)

    import('./dynamicImportTestFunction').then(({ default: test }) => console.log('import? ' + test()))
    import('gsap').then(x => console.log('async import', x.default))
  }

  componentWillUnmount() {
    this.messageRef.off()
    clearInterval(this.interval)
  }

  async asyncFunction() {
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

function Hooks({ foo }) {
  useEffect(() => {
    console.log(foo)
  }, [])
  return null
}
