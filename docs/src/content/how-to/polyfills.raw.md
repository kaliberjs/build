## Polyfills

We're using [polyfill.io](https://polyfill.io) ([Financial-Times/polyfill-service](https://polyfill.io/)) for polyfills:

> Polyfill.io is a service which makes web development less frustrating by selectively polyfilling just what the browser needs. Polyfill.io reads the User-Agent header of each request and returns polyfills that are suitable for the requesting browser.

For now we're using the hosted version by Polyfill.io. In the future we might implement a local version of polyfill, but first this library needs to cleanup their dependencies. ([#153 comment](https://github.com/kaliberjs/build/pull/153#issuecomment-433186784)).

### features and aliases
Our `polyfill()` method (see example below) expects an array of features and aliases. See https://polyfill.io/v2/docs/ for more info about features and aliases.


### Examples

```jsx
// import the polyfill
import polyfill from '@kaliber/build/lib/polyfill'

export function fnName() {
  return (
    <html lang="en">
      <head>
        {/* call the polyfill with the required aliases and features */}
        {polyfill(['default', 'es2015', 'es2016', 'es2017', 'fetch'])}
        {/*
          this will output:
          <script defer src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,es2015,es2016,es2017,fetch" crossorigin="anonymous" />
        */}
      </head>
      <body />
    </html>
  )
}
```
