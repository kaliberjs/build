## Rollbar error reporting

Our error reporting service of choice is Rollbar. To make life easier there's a convenient helper to render the rollbar-config and -snippet inside your head component.

## Usage

Import `@kaliber/build/lib/rollbar` and execute it with an options object. It will return a script tag with the Rollbar-config and -snippet.

## Options

See https://docs.rollbar.com/docs/rollbarjs-configuration-reference for all available options.

### Default options

```js
const defaultOptions = {
  captureUncaught: true,
  captureUnhandledRejections: true,
  scrubTelemetryInputs: true,
  captureIp: false,
  payload: { environment: process.env.CONFIG_ENV },
  autoInstrument: { log: process.env.NODE_ENV === 'production' },
}
```

### Example

```jsx
import rollbar from '@kaliber/build/lib/rollbar'

export function fnName() {
  return (
    <html lang="en">
      <head>
        {/* include rollbar before any other javascript */}
        {rollbar({ accessToken, ignoredMessages })}

        {polyfill(['default', 'es2015', 'es2016', 'es2017', 'fetch'])}
        {javascripts}
      </head>
      <body />
    </html>
  )
}
```
