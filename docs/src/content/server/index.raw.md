## Server

This library comes with a node.js express server that can be used both for development and
production. It's very light weight and intentionally kept quite simple.

You free to use any server you like. There are no dependencies from the build tool to the server.

A high level overview of the express modules and handlers we have defined:

- `helmet` - Helmet helps secure the express app
- `compression` - Makes sure all responses are compressed
- configured `serveMiddleware` - Taken from the configuration to allow you to customize behavior
- `express.static` - Serves any file as a static file if it exists.
- `index.html.js` handler - If `index.html.js` exists, it will be used for all requests
- `404.html` handler - If `404.html` exists, it will be served if no route matched
- `index.html` handler - If `index.html` exists, it will be used for all requests
- `500.html` handler - If `500.html` exists and `NODE_ENV=production`, it will be served if an error was caught

{toc}

### Project types

- `index.html.js` - [Server side rendering](/server-side-rendering) (might render a single page application)
- `index.html`, `404.html` and `500.html` - [Static site](/how-to/static-site)
- `index.html` - [Single page application](/how-to/single-page-application)

### File resolution

- If a file exists: serve using `express.static`
- If not, look for `index.html.js` and serve that
- If not, look for `404.html` and serve that
- If not, look for `index.html` and serve that

This proces is repeated for each directory in the path. So if the path is `/a/b/something`, the server first
looks for these files in `/a/b/`, then in `/a/` and finally in `/` .

### Port

The server starts at the port defined by the environment variable named `PORT`.

### Middleware

Custom middleware can be configured with the following configuration setting:

```js
module.exports = {
  kaliber: {
    serveMiddleware: ...
  }
}
```

This setting is used as follows: `app.use(...[].concat(serveMiddleware))`

### Helmet

By default we have the `hsts` setting set to `false` because SSL offloading (and setting the `hsts`
headers) is done (in our case) by the load balancer. Because this is not the case for every hosting
service we allow you to adjust the configuration:

```js
module.exports = {
  kaliber: {
    helmetOptions: { ... }
  }
}
```

### `index.html.js`

The dynamic `index.html.js` template is special to our server. It checks if the exported function
has a `routes` property and will then execute its `match` function. The result of the `match`
function is used to determine the `status`, `headers` and `data` for the given request.

```js
index.routes = {
  match: async (location, req) => ({ status, headers, data })
}
```

The `location` and `data` are then fed back into the dynamic template.

```js
export default function index({ location, data }) {
  return ...
}
```
