## Basic authentication

We often lock down our sites that should not yet be in production or that serve another purpose
(test or acceptance) to prevent indexation and other unwanted uses.

The server from this library can be configured using the following configuration:

```js
const basicAuth = require('express-basic-auth')

module.exports = {
  kaliber: {
    serveMiddleware: basicAuth({
      challenge: true,
      realm: 'your site',
      users: {
        kaliber: 'making sense for future proof brands',
        username: 'password'
      }
    })
  }
}
```

If you want to secure only a specific path:

```js
const basicAuth = require('express-basic-auth')

module.exports = {
  kaliber: {
    serveMiddleware: ['/protected-path', basicAuth({ ... })]
  }
}
```
