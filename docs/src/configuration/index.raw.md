## Configuration

We tend to lean towards zero configuration. There are however a few essentials that do require
configuration.

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

All configuration of this library lives in the `kaliber` key.

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

#### templateRenderers

...

#### serveMiddleware

...
