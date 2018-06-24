## Redirects

Redirects are nothing more than a status code in the [`3XX`](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3)
range combined with a `Location` header.

If you are concerned with SEO, please read about to the status codes to figure out which one to use.

{toc}

### router

You can use the router to perform redirects:

```js
index.routes = {
  match: location => {
    if (location.pathname === '/old-path') {
      return { status: 301, headers: { Location: '/new-path' } }
    }
  )
}

export default function index() {
  ...
}
```

### express middleware

In some cases you do not need server-side rendering, but you do need redirects. In this case you
could configure middleware to perform the redirect:

```js
module.exports = {
  kaliner: {
    serveMiddleware: [
      '/old-path',
      (req, res) => { res.status(301).set({ Location: '/new-path' }).send() }
    ]
  }
}
```
