## React router

Our server was not designed to be a very good fit for React router. We do believe the way React
router handles itself in the client is the way to go (the React way - V4). We are however not
completely convinced you would need the React router library to do that way of routing. In most
cases a simple if statement or some regular expressions will be fine.

We do not believe that the routes on the client should be the same as the ones on the server. Or
more specifically, we do not believe the routes on the server should have the same granularity as
the routes on the client.

The server should fetch the main content of a page and respond with a `404` if that content is not
present. Any other details should be handled in the client (extra information, showing a certain
tab, ...).

In any case, if you do not want to roll your own server and really want to use React router, here
is how you could do it.

`src/index.html.js`
```jsx
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router'

import App from '/App?universal'

index.routes: {
  match: location => {
    const context = {}
    const app = ReactDOMServer.renderToString(
      <StaticRouter location={location} context={context}>
        <App/>
      </StaticRouter>
    )
    const headers = context.url ? { Location: context.url } : {}
    const status = context.status
    return { status, headers, data: { app } }
  }
}

export default function index({ location, data: { app } }) {
  return (
    <html>
      <head />
      <body>
        <div dangerouslySetInnerHTML={{ __html: app }} />
      </body>
    </html>
  )
}
```

`src/App.js`
```jsx
import { BrowserRouter } from 'react-router-dom'

export default class App extends Component {

  render() {
    return this.isMounted
      ? <BrowserRouter><ActualApp /></BrowserRouter>
      : <ActualApp />
  }

  componentDidMount() {
    this.isMounted = true
  }
}
```

Once you start loading data and combine it with server side rendering things become a bit messy. It
essentially requires you to define routes outside of your component structure and define how they
should load data. Read more about that here: [react-router/server-rendering/data-loading](https://reacttraining.com/react-router/web/guides/server-rendering/data-loading).

Once you go down this path you will probably come to a similar guideline:

> 404 and redirects are determined by either a non-existing route or missing data

This means you need 2 pieces of knowledge:
1. The valid endpoints
2. The availability of data at such an endpoint

To us rendering the application is not the best approach to find that out. This knowledge however
can be made available to the client when it should take over. You can simply extract that knowledge
to a separate file and import it.

[Isomorphic (Universal) javascript](/how-to/isomorphic-javascript) goes into some of the details
regarding this topic.
