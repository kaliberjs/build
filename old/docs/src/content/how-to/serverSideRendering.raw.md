## Server side rendering

On one side of the spectrum you have [static sites](/how-to/static-site), on the other side you have
server side rendering (or dynamic sites). The core of the idea here is that you take data from a
datasource and render it on the server.

It is recommended to read the documentation about [static sites](/how-to/static-site) to learn more
about modular and non-modular CSS. It also explains how to add interaction with javascript.

For this library server side rendering means two things:
1. Instead of creating rendered template during build we provide a function that takes data and
   returns a response.
2. Along with the function we provide another function that takes the request and determines the
   status code, headers and data for the response.

The provided mechanism was created to be used with the built-in server, but that is not a hard
requirement. Any node.js server can be used to execute the compiled functions.

{toc}


### Creating the template

The convention we use for creating a dynamic template (versus a static template) is: return a
function value. An example:

`src/index.html.js`
```jsx
return function index({ location }) {
  return (
    <html>
      <head></head>
      <body>
        <p>Hello world at {location.pathname}</p>
      <body>
    </html>
  )
}
```

As you can see the library performs the following tasks:
- picks up the `{name}.html.js` file
- detects it is a function
- grabs the registered `html` renderer and prepares it with the file
- emits a `{name}.html.js` file that essentially contains a function like this:
  `props => render(template(props))`


### Use with the built-in server

We went one step further with our library to provide an out-of-the box package that can be used to
do real world server side rendering. Feel free to look at the code of `serve.js` and roll your
own if you don't agree with our conventions here, it's not very complicated.

A basic template to be used with the built-in server looks like this:

```jsx
index.routes = {
  match: async location => {
    try {
      if (location.pathname.startsWith('/fetch')) {
        const content = await fetchData(...)
        const missing = !content
        return { status: missing ? 404 : 200, data: { missing, content } }
      }
      return { status: 404, data: { missing: true } }
    } catch (e) {
      return { status: 500, data: { error: true } }
    }
  }
}

export default function index({ location, data }) {
  const { error, missing, content } = data
  return (
    <html>
      <head></head>
      <body>
        {error
          ? '500 - error'
          : missing
          ? '404 - not found'
          : <p>{content}</p>
        }
      </body>
    </html>
  )
}
```

The server checks the existence of a `routes` object on the function returned from `index.html.js`
and calls it's `match` function. The result of this function is used to set the `status` of http
response and the `data` is supplied to the template function.

Note that the location object is provided by a utility from the [`history`](https://www.npmjs.com/package/history)
package. This library could be used to provide client side routing.


### When to use

This type of site it used for a site that wants to render something based on information from a
datasource that changes independently of your code. If this datasource changes in step with your
code, you might be better off creating a static site (build time rendering).

Content sites with data from a database, like a CMS, are good candidates for server side rendering.

If you have something that requires a login, a single page application might be your best choice.


### Routing

We made the conscious choice to keep server and client side routing separate. This allows for an
easy mental model while still giving enough freedom for users to pick any routing mechanism.

We have not settled for library that we want to use for routing and we might want to roll our own,
it will however not be part of this library.

#### match

The match function signature is as follows:

```
(location: HistoryLocation, req: ExpressRequest) =>
  { status: Number, data?: Any, headers?: { [Name: String]: String } }
```

In most cases you do not need the `req` from express, we however provide it in case you do need it.

The `headers` can be used to supply a specific content type or to perform redirects.

Note that if you return a 'falsy' response from the `match` method, or don't supply a `match` method
at all it will default to `{ status: 200, data: null }`.

#### redirects

Redirects are nothing more than a status code in the [`3XX`](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3)
range combined with a `Location` header.

If you are concerned with SEO, please read about to the status codes to figure out which one to use.

### Use without the built-in server

The server we provide is very lightweight and designed to push people into using a specific style
of coding. It is our vision that the node.js server used to supply the browser with content should
not do any other backend specific tasks.

We however understand that this is a very company specific choice. So don't feel bad if you do not
want to use our supplied server. The fact that our server has nothing to do with hot reloading makes
it very easy to roll your own.

The system of template renderers is very powerful and the generated template function is partially
applied with the specific template renderer. This means you can call the template function with
parameters and the result is passed throught the specific template renderer.

```
props => render(template(props))
```

You could say the renderer is injected into the template function.
