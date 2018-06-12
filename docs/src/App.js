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

    const [page = 'not-found', title = 'Not found', content = 'Sorry'] =
      pages.find(([page]) => page + '/' === location) || []

    return (
      <div>
        <h1>{title}</h1>
        <Menu {...{ pages, page }} />
        <Content>{content}</Content>
      </div>
    )
  }

  componentDidMount() {
    const { publicPath } = this.props
    const self = this

    updateLocation()
    window.onpopstate = updateLocation

    function updateLocation() {
      const extractedLocation = locationFromHash() || locationFromPathname()
      if (extractedLocation) {
        const location = extractedLocation.endsWith('/') ? extractedLocation : extractedLocation + '/'
        self.setState({ location })
        window.history.replaceState(null, null, publicPath + location)
      }
    }
    function locationFromHash() { return document.location.hash.slice(1) }
    function locationFromPathname() { return document.location.pathname.replace(publicPath, '') }
  }
}
