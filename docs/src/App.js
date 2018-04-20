import introduction from '/introduction'
import gettingStarted from '/getting-started'
import Menu from '/Menu'
import Content from '/Content'

const pages = [
  ['introduction', 'Introduction', introduction],
  ['getting-started', 'Getting started', gettingStarted]
]

export default class App extends Component {

  state = {
    location: 'introduction'
  }

  render() {
    const { location } = this.state
    if (!location) return null

    const [page, title, content] = pages.find(([page]) => page === location)

    return (
      <div>
        <h1>{title}</h1>
        <Menu {...{ pages, page }} />
        <Content>{content}</Content>
      </div>
    )
  }

  componentDidMount() {
    const self = this
    updateLocation()
    window.onpopstate = updateLocation

    function getLocation() { return document.location.hash.slice(1) }
    function updateLocation() {
      const location = getLocation()
      if (location) {
        self.setState({ location })
        window.history.replaceState(null, null, location)
      }
    }
  }
}
