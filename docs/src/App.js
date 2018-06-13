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
    pageInfo: []
  }

  render() {
    const { pageInfo: [page = 'not-found', title = 'Not found', content = 'Sorry'] = [] } = this.state

    return (
      <React.Fragment>
        <h1>{title}</h1>
        <Menu {...{ pages, page }} />
        <Content>{content}</Content>
      </React.Fragment>
    )
  }

  componentDidMount() {
    const { publicPath } = this.props
    const self = this

    updateLocation()
    window.onpopstate = updateLocation

    function updateLocation() {
      const result = pageInfoFromHash() || pageInfoFromPathname()
      if (result) {
        const { location, pageInfo } = result
        self.setState({ pageInfo })
        window.history.replaceState(null, null, publicPath + location)
      }
    }
    function pageInfoFromHash() {
      const [routingHash, userHash] = document.location.hash.slice(1).split('#')
      return getPageInfo(routingHash, userHash ? '#' + userHash : '')
    }

    function pageInfoFromPathname() {
      const location = document.location.pathname.replace(publicPath, '')
      return getPageInfo(location, document.location.hash)
    }

    function getPageInfo(extractedLocation, userHash) {
      const location = extractedLocation.endsWith('/') ? extractedLocation : extractedLocation + '/'
      const pageInfo = pages.find(([page]) => page + '/' === location)
      return pageInfo && { location: location + userHash, pageInfo }
    }
  }
}
