import introduction from '/introduction/index.raw.md'
import choices from '/choices/index.raw.md'
import gettingStarted from '/getting-started'
import { dynamic, landingPage, mailTemplates, redirects, singlePage, staticSite, wordpress } from '/how-to'
import Menu from '/Menu'
import Content from '/Content'

const pages = [
  ['', '@kaliber/buid', '-- This is a work in progress --'],
  ['introduction', 'Introduction', introduction],
  ['getting-started', 'Getting started', gettingStarted],
  ['choices', 'Choices', choices],
  ['how-to', 'How to', [
    ['static-site', 'Static site', staticSite],
    ['dynamic', 'Server side rendering', dynamic],
    ['landing-page', 'A page in a sub-directory', landingPage],
    ['mail-templates', 'Mail templates', mailTemplates],
    ['redirects', 'Redirects', redirects],
    ['single-page', 'Single page application', singlePage],
    ['wordpress', 'Integrate with WordPress', wordpress],
  ]],
]

const flattenedPages = pages.reduce(
  (result, [id, title, componentOrSubPage]) => [
    ...result,
    ...(
      Array.isArray(componentOrSubPage)
        ? componentOrSubPage.map(([subId, title, component]) => [id + '/' + subId, title, component])
        : [[id, title, componentOrSubPage]]
    )
  ],
  []
)

export default class App extends Component {

  state = {
    pageInfo: []
  }

  render() {
    const { publicPath } = this.props
    const { pageInfo: [page = 'not-found', title = 'Not found', content = 'Sorry'] = [] } = this.state

    return (
      <React.Fragment>
        <h1>{title}</h1>
        <Menu {...{ pages, page, publicPath }} />
        <Content>{content}</Content>
      </React.Fragment>
    )
  }

  componentDidMount() {
    const { publicPath } = this.props
    const self = this

    updateLocation()
    window.onpopstate = updateLocation
    const originalPushState = window.history.pushState
    window.history.pushState = pushState

    function pushState(...args) {
      originalPushState.apply(window.history, args)
      updateLocation()
    }

    function updateLocation() {
      const result = pageInfoFromHash() || pageInfoFromPathname()
      if (result) {
        const { location, pageInfo } = result
        self.setState({ pageInfo })
        const [_, title = null] = pageInfo || []
        window.history.replaceState(null, title, publicPath + location)
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
      const pageInfo = flattenedPages.find(([page]) =>
        console.log('searching:', page + '/', location) || page + '/' === location)
      return pageInfo && { location: location + userHash, pageInfo }
    }
  }
}
