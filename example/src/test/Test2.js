export default class Test2 extends Component {

  state = { message: 'unmounted' }

  render() {
    return <div>Test2 - {this.state.message}</div>
  }

  componentDidMount() {
    this.setState({ message: 'mounted' })
  }
}
