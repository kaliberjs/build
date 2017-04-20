import Test2 from './Test2'
import styles from './test.css'

export default class Test extends Component {
  state = { counter: 0 }

  render() {
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
