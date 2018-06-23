## Single page application

A single page application is an application that effectively stays on the same html page. It's
logic is completely handled by the browser. In most cases the html looks very simple, something
like this:

```jsx
<html>
  <head />
  <body>
    <div id='app' />
  </body>
</html>
```

The `app` div is then populated using javascript. The only thing required by the server is to serve
all requests using the `/index.html` page.

In general this is only advised in two situations:
- The `app` is locked down using (or hiding behind) a login screen
- It is a component that has no (or a low) value for indexation by search engines
- You combine it server side rendered metadata

The basic implentation of a single page application is described by the following:

> Declare a universal component does not render anything on the server

An example:

`src/index.html.js`
```jsx
import App from '/App?universal'

export default (
  <html>
    <head />
    <body><App /></body>
  </html>
)
```

`src/App.js`
```jsx
export default class SinglePageApplication extends Component {

  state = {
    isMounted: false
  }

  render() {
    return isMounted
      ? <App {...this.props} />
      : null
  }

  componentDidMount() {
    this.setState({ isMounted: true })
  }
}

class App extends Component {
  ...
}
```

{toc}

### Server side rendering with a single page application

The idea here is that you have a single page application application that lives inside of an html
document for which the metadata does change. With metadata we mean `meta` tags for things like
Facebook, Google, Twitter, ... And also things like the `title` element or structured data
definition.

```jsx
import App from '/App?universal'

index.routes = {
  match: async location => {
    const data = await fetchMetadataForLocation(location)
    return { data }
  }
}

export default function index({ data }) {
  return (
    <html>
      <head>
        {renderMetadata(data)}
      </head>
      <body>
        <App />
      </body>
    </html>
  )
}
```

This type of mixture between single page application and server side rendering can be a smart
choice. You skip the complexity of universal rendering while providing enough metadata for the url's
to be shared through social media.

### Status codes

When the app is hiding behind a login the value of status codes is very low. So if that is your use-
case. Just ignore the status codes.

If only small parts of your app are single page applications (or maybe we should call them dynamic
components) status codes can also be ignored.

If you do have a use case where status codes are important you have two options:

1. Go for server side rendering and ignore its `location` and `data`
2. Add express middleware using the configuration

### server

The built-in server will serve a static `index.html` for each request when the following conditions
are met:

- There is no actual resource with that name
- There is no `index.html.js`
- There is no `404.html`
