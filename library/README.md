**This package is not ready for public consumption**

Breaking changes:

- v0.0.51 -
  - `chunk-manifest.json` changed.
  - `*.entry.css` classnames are no longer hashed.
  - CommonJS modules imported with async `import()` are wrapped into the default export (`await import('flickity')` becomes `await import('flickity').default`).
- v0.0.47 - Universal apps no longer have an extra `<div />` around the root-app-node and the script-tag.
- v0.0.44 - `*.entry.css` filenames are now also hashed, use `css-manifest.json` to obtain the filenames
- v0.0.41 - `*.*.js` are no longer all treated as templates, by default only `.html.js`, `.txt.js` and `.json.js` are considered
- v0.0.40 - `src` is no longer treated as `node_modules`, use absolute paths (`/x`) to retrieve modules from subdirectories
- v0.0.40 - Javascripts are now hashes, they require an additional import to load
- v0.0.35 - Stylesheets are now hashes, they require an additional import to load

# Kaliber.js build

An opinionated zero configuration build stack with React, PostCSS, Babel and Webpack as major ingredients.

## Installation
### Easy (scaffold template)
The scaffold-command will copy a template to an empty project-directory. It will not overwrite existing files.

Oneliner, inside your (empty) project folder:

```
yarn add @kaliber/build && ./node_modules/.bin/kaliber-scaffold && yarn start
```

or:
```
>> mkdir <projectname> && cd <projectname>

>> yarn add @kaliber/build

>> ./node_modules/.bin/kaliber-scaffold

>> yarn start
```

### Manual

```
>> yarn add @kaliber/build
```

`package.json`:
```json
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
- Hot css replacement support

## Conventions

Ruby popularized 'convention over configuration', this library has a set of conventions. If you disagree with a convention please open an issue so we can discuss it.

- `src` - Source files live in the `src` directory.
- `target` - Compiled / processed files are stored in the `target` directory.
- `src/**/*.entry.js` - Compiled as a separate `.js` webpack entry.
- `src/**/*.entry.css` - Compiled as a separate `.css` webpack entry (*without* hashed classnames).
- `src/**/*.{type}.js` - Compiled as webpack entry using a renderer associated with the type.
  - `{type}` refers to the renderer that is used
    - `html` - Expects JSX to be returned from the template
    - `txt` - Expects a string to be returned from the template
    - `json` - Expects a javascript object or array to be returned
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
  <html lang='en'>
    { head("Test title") }
    <body className={styles.background}>
      <p className={styles.context}>Test</p>
    </body>
  </html>
)
```
All css files used are combined into `{hash}.css`, you load them using the `stylesheet` library:

```jsx
import stylesheet from '@kaliber/build/lib/stylesheet'

<head>
  { stylesheet }
</head>
```

Similarly the js files are compiled to hashed names, you load them using the `javascript` library:

```jsx
import javascript from '@kaliber/build/lib/javascript'

<head>
  { javascript }
</head>
```

If you want to use the scripts in another language or framework, use the `chunk-manifest.json` file (saved to the `target` directory) to obtain the correct file names.

You can create a 'static' `404.html.js` which will be served (with status `404`) if it exists. If it does not exist the 'static' `index.html.js` file will be served. This allows you to create a static site with client-side routing.

## Usage (dynamic pages)

`src/index.html.js`
```jsx
import head from './partials/head'
import styles from './index.html.css'

main.routes = {
  // You can return a non-promise object
  // default status = 200 and data = null
  match: (location, req) => Promise.resolve({ status: ..., headers: ..., data: ... })
}

export default main

function main(({ location, data })) {
  return (
    <html lang='en'>
      { head('Test title') }
      <body className={styles.background}>
        <p className={styles.context}>Test</p>
        { data }
      </body>
    </html>
  )
}
```

If you did not know: redirects are one of the [redirect status codes](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html) (`3xx`) combined with a `Location` header.

## Usage (universal rendering)

```jsx
import head from './partials/head'
import Test from './partials/Test?universal' // Import the component with `?universal` to turn it into a universal component

export default (
  <html lang='en'>
    { head("Test title") }
    <body>
      <Test prop='value' />
    </body>
  </html>
)
```

Universal components are mounted in an extra `div` (the app container) which is generated by the library. To pass props to this app container you can use the `universalContainerProps`-property, e.g.:

```jsx
<Test prop='value' universalContainerProps={{ style: { height: '100%' } }} />
```

❗ A component that is imported with `?universal` should be passed serializable props (e.g. no `children`) (see [#48](https://github.com/kaliberjs/build/issues/48))

## Usage with environment-specific configuration

```jsx
import config from '@kaliber/config' // import environment-specific configuration
import head from './partials/head'
import Test from './partials/Test?universal' // Import the component with `?universal` to turn it into a universal component

export default (
  <html lang='en'>
    { head(config.title) }
    <body>
      <Test prop='value' configForClient={config.client} />
    </body>
  </html>
)
```

❗ The key `kaliber` is deleted from the `config` by a special loader as it is reserved to store configuration for the build and serve code.

If you need the configuration in a client component, pass it in using the props:
```jsx
  <Test prop='value' configForClient={config.client} />
```
❗ Never pass the whole configuration to the client; it will be rendered in the html and may contain secrets.

You could use [React context](https://facebook.github.io/react/docs/context.html) to easily access the configuration deeper in your react-application.

## Usage with dynamic imports

Dynamic imports are only compiled for the web, so make sure they are in the 'web part' of your React components (`componentDidMount`). If you have a use case that requires dynamic imports to work on the server side as well, raise an issue with your use-case. Example:

```jsx
componentDidMount() {
  import('./dynamicImportTestFunction')
    .then(({ default: test }) => console.log('import?', test()))
}
```

## Kaliber configuration
The configuration-files can be used to configure kaliber/build features.
The following features are configurable:
- `kaliber-serve` with custom middleware
- `kaliber-build` and `kaliber-watch` with custom renderers and custom public path

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
    serveMiddleware: basicAuth({
      challenge: true,
      realm: 'xxx',
      users: {
        kaliber: 'XDR%5tgb',
        user: 'pass'
      }
    }),

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

### `kaliber-build` and `kaliber-watch` with custom public path

You can change the default public path using the `kaliber.publicPath` configuration.

```js
// config/{CONFIG_ENV}.js

module.exports = {
  kaliber: {
    publicPath: '/subfolder/'
  }
}
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
>> yarn publish

>> git push

>> git push --tags
```
