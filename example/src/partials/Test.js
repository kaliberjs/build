import Test2 from './Test2'
import styles from './test.css'
import json from './test.json'

export default class Test extends Component {
  state = { counter: 0 }

  render() {
    console.log(json)
    return (
      <div>
        {this.props.soep}
        {this.state.counter}
        <Test2 />
      </div>
    )
  }

  componentDidMount() {
    this.interval = setInterval(() => this.setState(({ counter }) => ({ counter: counter + 1 })), 1000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }
}
