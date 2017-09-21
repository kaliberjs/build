**This package is not ready for public consumption**

# Kaliber.js build

An opinionated zero configuration build stack with React, PostCSS, Babel and Webpack as major ingredients.

## Installation

```
yarn add @kaliber/build
```

`package.json`:
```
{
  "scripts": {
    "build": "kaliber-build",
    "watch": "kaliber-watch",
    "serve": "PORT=8000 kaliber-serve"
  }
}
```

## Features

- Static React templates
- Dynamic (server side rendered) React templates
- Easy universal rendering
- CSS modules and CSS merging
- Source map support
- Hot module replacement support
- Image support
- Environment specific configuration
- Template system
- Copying of 'unused' files (❗ Do not put sensitive information in your `src` directory)
- Dynamic imports

## Conventions

Ruby popularized 'convention over configuration', this library has a set of conventions. If you disagree with a convention please open an issue so we can discuss it.

- `src` - Source files live in the `src` directory.
- `target` - Compiled / processed files are stored in the `target` directory.
- `src/**/*.entry.js` - Compiled as a separate `.js` webpack entry.
- `src/**/*.entry.css` - Compiled as a separate `.css` webpack entry, for each CSS file a `.json` file is generated containing the class names.
- `src/**/*.{type}.js` - Compiled as webpack entry using a renderer associated with the type.
  - `{type}` refers to the renderer that is used
    - `html` - Expects JSX to be returned from the template
    - `default` (when no renderer was registered) - If the template returns a string, the string is used. In other cases `JSON.stringify(...)`.
    - `{custom}` - It is possible to register custom renderers, see below for details.
  - `static` - Considered `static` when non-function value is exported, this value is passed to the renderer associated with the type.
  - `dynamic` - Considered `dynamic` when a function is exported, results in `*.{type}.js` with a function that accepts a single argument.
- `src/**/*` - Any files not used in the compilation will be copied to the target directory.
- `npm run *` - Expecting these commands to be called from the directory that contains `src` and `target`.
- `config/*.js` - See [kaliberjs/config](https://github.com/kaliberjs/config) for documentation.

## Known issues

Please check the list of [open issues](/kaliberjs/build/issues).

## Usage (static pages)

`src/index.html.js`
```
import head from './partials/head'
import styles from './main.html.css'

export default (
  <html>
    { head("Test title") }
    <body className={styles.background}>
      <p className={styles.context}>Test</p>
    </body>
  </html>
)
```
All css files used are combined into `index.css` if the entry was called `index.html.js`.

## Usage (dynamic pages)

`src/index.html.js`
```
import head from './partials/head'
import styles from './index.html.css'

main.routes = {
  match: (location, req) => Promise.resolve({ status: ..., data: ... })
}

export default main

function main(({ location, data })) {
  return (
    <html>
      { head('Test title') }
      <body className={styles.background}>
        <p className={styles.context}>Test</p>
        { data }
      </body>
    </html>
  )
}
```

## Usage (universal rendering)

```
import head from './partials/head'
import Test from './partials/Test?universal' // Import the component with `?universal` to turn it into a universal component

export default (
  <html>
    { head("Test title") }
    <body>
      <Test prop='value' />
    </body>
  </html>
)
```

Note that universal rendering will change the html structure slightly (wrap an extra `div`), this can probably be changed when React 16 is released with array support.

## Usage with environment-specific configuration

```
import config from '@kaliber/config' // import environment-specific configuration
import head from './partials/head'
import Test from './partials/Test?universal' // Import the component with `?universal` to turn it into a universal component

export default (
  <html>
    { head(config.title) }
    <body>
      <Test prop='value' configForClient={config.client} />
    </body>
  </html>
)
```

❗ The key `kaliber` is deleted from the `config` by a special loader as it is reserved to store configuration for the build and serve code.

If you need the configuration in a client component, pass it in using the props:
```
  <Test prop='value' configForClient={config.client} />
```
❗ Never pass the whole configuration to the client; it will be rendered in the html and may contain secrets.

You could use [React context](https://facebook.github.io/react/docs/context.html) to easily access the configuration deeper in your react-application.

## Usage with dynamic imports

Dynamic imports are only compiled for the web, so make sure they are in the 'web part' of your React components (`componentDidMount`). If you have a use case that requires dynamic imports to work on the server side as well, raise an issue with your use-case. Example:

```
componentDidMount() {
  import('./dynamicImportTestFunction')
    .then(({ default: test }) => console.log('import?', test()))
}
```

## Kaliber configuration
The configuration-files can be used to configure kaliber/build features.
The following features are configurable:
- `kaliber-serve` with custom middleware
- `kaliber-build` and `kaliber-watch` with custom renderers

### `kaliber-serve` with custom middleware

The `kaliber.serveMiddleware` configuration is passed directly in the [`use`](http://expressjs.com/en/api.html#app.use) function of Express:

```js
app.use(config.kaliber.serveMiddleware)
```

Example with a basic-auth filter:
```js
// config/{CONFIG_ENV}.js

const basicAuth = require('express-basic-auth')

module.exports = {
  kaliber: {
    serveMiddleware: basicAuth({ ... }),
    
    // or
    serveMiddleware: ['/protected-path', basicAuth({ ... })]
  }
}
```

### `kaliber-build` and `kaliber-watch` with custom renderers

You can register specialized template types using the `kaliber.templateRenderers` configuration.

Example with a mail template:
```js
// config/{CONFIG_ENV}.js

module.exports = {
  kaliber: {
    templateRenderers: {
      mjml: '/mjml-renderer'
    }
  }
}
```

```js
// src/mjml-renderer.js
import { mjml2html } from 'mjml'
import htmlReactRenderer from '@kaliber/build/lib/html-react-renderer'

export default function mjmlRenderer(template) {
  const { html, errors } = mjml2html(htmlReactRenderer(template))

  if (errors.length > 0) throw new Error(errors.map(e => e.formattedMessage).join('\n'))

  return html
}
```

The above configuration allows you to write mjml templates using JSX and process them through `mjml`. A file `mail.mjml.js` would be rendered into `mail.mjml`. An example of such a `mjml` template:

```js
export default (
  <mjml>
    <mj-head />
    <mj-body>
      <mj-container>
        <mj-section>Text</mj-section>
      </mj-container>
    </mj-body>
  </mjml>
)
```

## Motivation

At Kaliber we have created a lot of different projects over the years, each using a different set of technologies that seemed more suitable for the task. This library is an attempt to reduce the number of technologies required to build a website. We have created this library with three use cases in mind:

1. Static pages
2. Single page applications
3. Wordpress sites 

The second motivation for this project is the amount of time that was spent to set up a projects build stack. Some of our projects use Gulp, others use Webpack. It all felt way too complicated, slow or fit for a single purpose. We eventually chose webpack and created some loaders and plugins that are easier to understand than the ones that were available by default. The code in this library is not simple per-se, but it contains a lot less lines of codes compared to the alternatives.

This library is for Kaliber, we chose a set of conventions and configurations that work for us. These choices sacrifice configurability for consistency and ease of use.

## Publish

To publish a new version:

```
>yarn publish

>git push

>git push --tags
```
