## Isomorphic (Universal) javascript

Isomorphic javascript is javascript that is executed both on the server and client. Server here can
also be a build server (or your local machine). A better distinction is code that is run by node.js
and by the browser.

One of the design goals of this library was to make isomorphic/universal javascript as easy as it
can be.

{toc}

### universal

To make a component 'isormorphic' or 'universal' the only thing you need to do is import it with
`?universal` appended.

```jsx
import App from '/App?univeral'

export default (
  <html>
    <head></head>
    <body>
      <App />
    </body>
  </html>
)
```

In this example `App` is universal and will be rendered both on the server and client.

Note that switching from a non-universal component to a universal component changes the resulting
html. When `?universal` is added, the result of `App` is rendered into an extra `<div />`. This is
needed to later 'hydrate' it again using `App` in the client.

This extra `<div />` can be given properties by giving the `<App />` a `universalContainerProps`
prop:

```jsx
<App universalContainerProps={{ className: styles.appContainer }} />
```

Because of the 'universal' nature of the component, any props passed to the component other than
`universalContainerProps` will be serialized to make sure they are available on the client as well.
As a consequence, it's not possible to pass `children` and other data types that can not be
serialized to JSON.


### window

When using this library you have to take into account that all of your components are rendered using
nodejs. This means that the `window` scope is not available.

It's a good rule of thumb that 'life in the browser' only starts after `componentDidMount` has been
executed. So make sure that anything involving the window scope or things like timers are only
executed from the `componentDidMount` life-cycle hook.

Some libraries are created for the browser. They might assume that the window scope is present on
load. In those cases you can take advantage of runtime imports:

```js
async componentDidMount() {
  await import('windowDependentLibrary')
  window.functionAddedByLibrary()
}
```

### initial data (no children)

Passing data to your universal component is easy, just pass in props:

```jsx
<App prop='value' />
```

On the client (in the browser) the passed in props should be considered initial data. Please note
that these props are serialized to JSON. This means you can only pass in values that are part of
the JSON spec.

Passing functions or children does not work. This means that the following will fail:

```jsx
import App from '/App?univeral'

export function fnName() {
  return (
    <html lang="en">
      <head />
      <body>
        <App>
          <h1>Title</h1>
          <p>Content</p>
        </App>
      </body>
    </html>
  )
}
```

### routing

Routing in the browser works is different from routing on the server. In the browser you would need
the following ingredients to create client side routing:

- `window.onpopstate` - Listen for `back` actions.
- `window.history.pushState` - Change the url and add it to the history.
- `window.history.applyState` - Change the url and replace the current history item.
- `document.location` - Obtain the current location.

Each link you have should call `pushState` and buttons (for example tabs) might call `replaceState`.
An simple example of a component that could help you with that looks like this:

```jsx
export function Link({ href, title, children }) {
  return <a {...{ href, onClick }}>{children}</a>

  function onClick(e) {
    e.preventDefault()
    window.history.pushState(null, title, href)
  }
}
```

In your app you need to handle changes to the location:

```jsx
export default class App extends Component {

  state = {
    location: null
  }

  render() {
    return (location && location.pathname) || 'rendered on the server'
  }

  componentDidMount() {
    const updateLocation = () => { this.setState({ location: document.location }) }

    updateLocation()

    window.onpopstate = updateLocation
    patch('pushState')
    patch('applyState')

    function patch(method) {
      const original = window.history[method]
      window.history[method] = function patchedHistoryMethod(...args) {
        original.apply(window.history, args)
        updateLocation()
      }
    }
  }
}
```

As you can see the `App` now handles any changes to the history. This version however is not yet
universal. It will first display `rendered on the server` and then, once the client code has been
loaded it will display the location.

To make it truly universal you would need to the following changes:

```jsx
import App from '/App?univeral'

export function index({ location }) {
  return (
    <html lang="en">
      <head />
      <body>
        <App {...{ location }} />
      </body>
    </html>
  )
}
```

```jsx
export default class App extends Component {

  state = {
    location: this.props.location
  }

  ...
}
```

### when to use

It doesn't always make sense to take the effort and make an application universal.

If an application is hiding behind a login screen, don't bother. You could just as well create a
single page application.

If an application requires page transitions you do need it to be truly universal.

In most cases you would just make small parts universal. An example could be a form, a set of tabs
or a carousel. And when using small universal parts you always need to think about the content you
want to have rendered by the server.

For a form you don't need any data. The location is not required to be passed in from the server and
it most likely does not need data to be displayed.

For a set of tabs you would need to the location in order to display the correct active tab. You
could however choose to allways display the contents of the first tab on refresh.

For a carousel you could display the first image. This information might be fetched from the
database and would be passed in from the server. You could however choose to display a loader at
first and only retrieve data once the client is loaded.

Conclusion: think about what you need and implement with the minimal amount of effort.

ps. Another good reason to use this feature is to learn `;-)`
