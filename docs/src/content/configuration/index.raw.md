## Configuration

We tend to lean towards zero configuration. There are however a few essentials that do require
configuration.

This library does provide a way to have environment specific configuration in your project.

{toc}

### Environment variables

There are things that depend on the environment and that change between almost all deployments. For
these cases we use environment variables.

#### NODE_ENV

We only use the `NODE_ENV` variable to determine if this is a `production` build. Libraries tend to
check if it's value is `production` and produce a more performant version.

We only take a value of `production` to mean 'production build'.

Please be aware that `yarn install` uses the `NODE_ENV` variable to only include the `dependencies`
part of your `package.json`, it ignores `devDependencies`. So on your build server use
`yarn install --production=false`.

#### CONFIG_ENV

This is used to determine which configuration file to use. We use the following convention:

| Config  | Name        | Description                                                       |
| ------- |------------ | ----------------------------------------------------------------- |
| *`dev`* | development | Our local computers.                                              |
| *`tst`* | test        | A server for us to test in a similar environment as production.   |
| *`acc`* | acceptance  | A server for the customer to preview and accept upcoming changes. |
| *`prd`* | production  | The production server.                                            |

We use [`@kaliber/config`](https://github.com/kaliberjs/config) to load the configuration. Note that
the an import of `@kaliber/config` is forbidden in the client side javascript files.

#### PORT

The `PORT` is only used by the server to determine on what port to accept http requests.

### Configuration settings

We use [`@kaliber/config`](https://github.com/kaliberjs/config) to load the configuration. The
`config/` directory holds the configuration files. If you supply `CONFIG_ENV=dev` it will look for
a `config/dev.js` file.

If you have a settings that is the same in all configuration environment you can place it in the
`config/default.js` file. If you want to test something you can use `config/local.js` to override
a setting. It's recommended to add `config/local.js` to your `.gitignore` file.

These different files are merged in the following order:
1. `default.js`
2. `${CONFIG_ENV}.js`
3. `local.js`

All configuration that is specific for this library lives in the `kaliber` key.

```js
module.exports = {
  kaliber: {
    ...
  }
}
```

#### publicPath

The `publicPath` setting determines the sub-directory your application will live in once deployed.
This setting should most likely be placed in the `config/default.js` file.

```js
module.exports = {
  kaliber: {
    publicPath: '/build/'
  }
}
```

#### node externals

In the case that you want to force a node_module to be parsed with Babel you can add them to
`compileWithBabel`, The config works the same as the [`webpack configuration`](https://webpack.js.org/configuration/module/#condition)
and whitelists node_modules using [`webpack-node-externals`](https://github.com/liady/webpack-node-externals#optionswhitelist-).

```js
module.exports = {
  kaliber: {
    compileWithBabel: [/node_modules\/subscribe-ui-event/]
  }
}
```

#### templateRenderers

Template renderes react to the `*.xyz.js` pattern. The `xyz` part refers to the renderer.

An example of specifying an `mjml` renderer which handles `*.mjml.js` files:
```js
module.exports = {
  kaliber: {
    templateRenderers: {
      mjml: '/mjml-renderer'
    }
  }
}
```

Note that template if a template file exports a function it will retain the same name. If it exports
a non function, the result of the renderer will be placed in a file without the `.js` part.

- `index.html.js` with function exported results in `index.html.js`
- `index.html` with a non function exported results in `index.html`

See [template-renderers](/template-renderers) for more details.

#### serveMiddleware

We try to keep our node server as simple as possible. Sometimes however we need to add something to
the express server. In some prototypes we want to experiment with a technology and on most test and
acceptance servers we want to enable basic authentication.

```js
module.exports = {
  kaliber: {
    serveMiddleware: xxx
  }
}
```

The value that is placed on the `xxx` will be injected into the following code:

```js
app.use(...[].concat(serveMiddleware))
```

This allows you to call the `use` function in any way you like. If you only need to supply a single
argument you set the value of that argument to `serveMiddleware`. If you need multiple arguments you
define `serveMiddleware` as an array corresponding to those arguments.

A note on arrays: we merge the `default` configuration with the current staging's configuration as objects, so array values (as for example in `serveMiddleWare`) are overwritten by the one with the same key in current staging's configuration.

```js
// default.js
{ test: [1, 2, 3] }

// phase.js
{ test: [4, 5] }

// result
{ test: [4, 5, 3] }
```

If this is the case for you, it is best to define arrays in each staging's configuration and not in `default`.

#### Error reporting
While in production, you're probably curious what server errors may occur, or you have a support ticket stating a page is broken. This error is by default reported to by a `console.error` but it is possible to report these errors to somewhere else by adding a `reportError` function to the config of your project.

```js
module.exports = {
  kaliber: {
    reportError: (err, req) => {
      reportToRollbar(err, req) // Or any other error reporting system
    }
  }
}
```
#### universal

One problem with universal rendering is that React contexts do cross the client / server gap. A context defined in server rendered code is not useable in client side code. Any values passed from `server` to `client` must be passed using props.

A way to solve this issue is to wrap your universal component in a consumer of the context, converting the value to props. And then on the client convert those props back into a provider of that context. To simplify this mechanism you can provide universal client and server wrappers:

```js
module.exports = {
  kaliber: {
    universal: {
      clientWrapper: '/wrapper/Client',
      serverWrapper: '/wrapper/Server',
    }
  }
}
```

`/wrapper/Client`
```jsx
import { ClientConfigProvider } from '/ClientConfig'

// eslint-disable-next-line @kaliber/no-default-export
export default function ClientWrapper({ children, ...props }) {
  return <ClientConfigProvider config={props.clientConfigContext} {...{ children }} />
}
```

`/wrapper/Server`
```jsx
import { useClientConfig } from '/ClientConfig'

// eslint-disable-next-line @kaliber/no-default-export
export default function ServerWrapper({ children, ...props }) {
  const clientConfigContext = useClientConfig()
  return React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child, { clientConfigContext })
      : child
  )
}
```

`/ClientConfig`
```jsx
/** @type {React.Context<any>} */
const clientConfigContext = React.createContext({})

export function ClientConfigProvider({ children, config }) {
  return <clientConfigContext.Provider value={config} {...{ children }} />
}

export function useClientConfig() {
  return React.useContext(clientConfigContext)
}
```

This allows you to only specify the `ClientConfigProvider` at the root of your server rendered application and use the context in clients.

#### symlinks

When you develop libraries that use peer dependencies this setting can help as it prevents webpack from resolving symlinks during resolution of libraries.

```js
module.exports = {
  kaliber: {
    symlinks: false
  }
}
```

#### webpackLoaders

In rare cases you need an additional loader for a file type that is unknown. In most cases the use of templates (`*.xyz.js`) is sufficient.

```js
module.exports = {
  kaliber: {
    webpackLoaders: [
      {
        test: /\.ext$/,
        loaders: [{ loader: 'ext-loader' }]
      },
    ],
  }
}
```

Note that these loaders are loaded after the `raw` loader and before all other loaders.

#### nativeCssCustomProperties

@kaliber/build uses `postcss-preset-env`'s `custom-properties` to enable custom properties for all browsers, but this limits their usability and isn't really needed anymore for modern browsers. You can use this setting to disable this plugin and thus enable native custom properties.

```js
module.exports = {
  kaliber: {
    nativeCssCustomProperties: true
  }
}
```

This will change some behavior you might rely on:

- Custom properties are no longer automatically picked up, but need to be imported.
- The `color-mod()` function no longer works in combination with custom properties, outside of the file in which they are declared ([it was dropped from the spec](https://github.com/w3c/csswg-drafts/commit/034b063697c3dadf144504f52e0858a79cd84414)). This gap will be filled by [CSS Color Module Level 5](https://www.w3.org/TR/css-color-5/).
