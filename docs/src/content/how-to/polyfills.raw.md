## Polyfills

We're using [polyfill.io](https://polyfill.io) ([Financial-Times/polyfill-service](https://polyfill.io/)) for polyfills:

> Polyfill.io is a service which makes web development less frustrating by selectively polyfilling just what the browser needs. Polyfill.io reads the User-Agent header of each request and returns polyfills that are suitable for the requesting browser.

For static sites we're using the hosted version by Polyfill.io.  
For server side rendered sites we're using the local version of polyfill.io. This will make these sites less dependent on external services which can collect privacy information or even break the site.

### features and aliases
Our `polyfill()` method (see examples below) expects an array of features and aliases. See https://polyfill.io/v2/docs/ for more info about features and aliases.


### Examples

#### Static sites
```jsx
// import the `polyfill`-method
import polyfill from '@kaliber/build/lib/polyfill'

export default (
  <html>
    <head>
      {/* call the polyfill with the required aliases and features */}
      {polyfill(['default', 'es2015', 'es2016', 'es2017', 'fetch'])}
      {/*
        this will output: 
        <script defer src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,es2015,es2016,es2017" crossorigin="anonymous" />
      */}
    </head>
    <body />
  </html>
)
```

#### Server side rendered sites
```jsx
// import `withPolyfill` for server side rendered sites
import withPolyfill from '@kaliber/build/lib/withPolyfill'

// the `withPolyfill` is a HOC which will inject the `polyfill`-method on your wrapped component
export default withPolyfill(Index)

function Index({ location, polyfill }) {
  return (
    <html>
      <head>
        {/* call the polyfill with the required aliases and features */}
        {polyfill(['default', 'es2015', 'es2016', 'es2017', 'fetch'])}
        {/*
          this will output: 
          `<script defer src="/polyfill.min.js?features=default,es2015,es2016,es2017" />`
        */}
      </head>
      <body />
    </html>
  )
}
```
