## Conventions

We strongly believe that conventions help us to be more productive. Conventions tend to get stuck in
your system and our brain seems to be really good at remembering them. Contrast this with
configuration for which we seem to have the convention: "don't remember, you can always look it up".

This library has quite a few conventions and a lot of them are enforced. It's quite possible that
you don't agree with some of these conventions. In some cases this is just a matter of taste, in
other cases there is reasoning. We love to hear your ideas about specific conventions. Even if
we do not agree on something, we will all walk away with a better understanding of the choices we
made.

So if you can not find a reason for a choice we made, please ask us. It might have been an
accidental choice and we do love to turn those choices into concious ones.

{toc}

### Directories

We assume the following project structure:

```
|_ package.json
|_ config/
|_ src/
|_ target/
```

#### config

The `config/` directory contains the configuration files loaded using `@kaliber/config`. An example
of it's typical contents:

```
|_ default.js
|_ dev.js
|_ tst.js
|_ acc.js
|_ prd.js
|_ local.js
```

`default.js` should only contain configuration that is the same in all configuration environments.

`dev`, `tst`, `acc` and `prd` are the conventions we use (DTAP). You are free to pick any other
convention, nothing in the library depends on this.

`local.js` is only used for testing to temporary override a configuration value and should be
included in your `.gitignore` file.

#### src

The `src/` directory holds the source files. Any source files that are not 'in use' are copied to
the `target/` directory. With 'in use' we mean somehow touched by Webpack by being referenced
through one of the [entries](#entries).

#### target

The `target/` directory is where the compilation writes it's result to. It is recommended you add
this directory to your `.gitignore` file.

### Execution

We assume the provided methods (`kaliber-watch`, `kaliber-build` and `kaliber-serve`) are being
executed from the directory that contains the `src/` and `targe/` directory.

### Entries

Webpack needs entries (or entry points) to function. These are the file patterns we use to gather
entries:

```js
[
  `**/*.@(${recognizedTemplateTypes.join('|')}).js`,
  '**/*.entry.js',
  '**/*.entry.css'
]
```

By default `html`, `json` and `txt` are registered as template types.

#### `*.entry.js`

This is used for plain-old javascript files. You would create this if your end-product is a
javascript file that would be loaded by some web framework.

In order to find out the compiled (fingerprinted) filename you need the contents of
`target/chunk-manifest.json`.

#### `*.entry.css`

This is used for plain-old CSS files. The difference with other CSS files (that are typically
imported from a javascript file) is that CSS modules are disabled. You would create this if the CSS
should apply to html created using another library or framework.

In order to find out the compiled (fingerprinted) filename you need the contents of
`target/css-manifest.json`.

#### `*.{type}.js`

These are templates and will be picked up if `{type}` is registered (or configured) as a template
renderer.

Note that the following types are reserved:
- `raw` - This is used as an indicator for Webpack to load the file using the `raw-loader`
- `entry` - This is used for the javascript entries

The following build-in types are registered:
- `html` - Expects a React element that is rendered to a string prepended with `<!DOCTYPE html>\n`
- `json` - Renders the resulting javascript value as JSON
- `txt`  - Expects string and returns it

You can override these defaults with your own implementation.

### Templates

A template is recognised by the `{name}.{type}.js` filename where `type` should be a registered
template renderer.

The default export value determines how the template is rendered.

#### Static templates

A static template is created by returning a non-function value. As a consequence this template is
executed as part of the build and `src/{name}.{type}.js` will rendered to `target/{name}.{type}`.

#### Dynamic templates

A dynamic template is created by returning a function value. As a consequence this template will be
packaged together with its renderer and `src/{name}.{type}.js` will be compiled to
`target/{name}.{type}.js`.

So the template (`props => type`) will be converted to `props => renderer(template(props))`.

### Loaders

We have configured a set of loaders for Webpack. These are triggered for import statements and file
references in CSS and javascript.

#### `*.raw.*`

These files are loaded using the [`raw-loader`](https://github.com/webpack-contrib/raw-loader). This
loader exports the file as a string. This is ideal for loading code snippets, markdown files and
other files that you need in raw string format.

#### `*.json`

JSON files are handled directly by Webpack, we do not use a special loader.

#### `*.entry.css`

These files are loaded using our own CSS loader. The difference with `*.css` files is that the CSS
modules plugin is configured with `global` as it's scope behavior.

#### `*.css (excluding node_modules)`

The css files from your project are loaded using our own CSS loader. This loader uses postcss which
is configured to use the following plugins:

- `postcss-import`                    - Allows for `@import` statements in CSS.
- `postcss-apply`                     - Allows for `@apply` statements in CSS.
- `postcss-preset-env`                - Use tomorrow’s CSS today.
- `postcss-modules-values`            - Pass arbitrary values between your module files.
- `postcss-modules-local-by-default`  - Make :local scope the default.
- `postcss-modules-scope`             - A CSS Modules transform to extract export statements from local-scope
                                        classes. Importing a CSS file into javascript provides an object that
                                        contains the original class names as key and locally scoped class names
                                        as value.
- `postcss-calc`                      - Reduce calc() references whenever it's possible.
- `postcss-url-replace`               - Our own plugin that makes sure all `url` references are loaded using the
                                        defined Webpack loaders.
- `postcss-import-export-parser`      - CSS imports and exports parser.
- `cssnano`                           - Is only used when `NODE_ENV=production` and minifies the javascript.

#### `*.css (if not matched by another pattern)`

In practice this is CSS from `node_modules`. Loaded using our CSS loader, all but the `cssnano`
plugins are disabled.

#### `*.js?transpiled-javascript-string`

In rare cases you need to add javascript in the body of a script tag. This can be used for that
scenario. Please note that this should be considered an undocumented feature, there are very few use
cases where you would need it.

#### `*.html.js and *.js (excluding node_modules)`

The files are processed using the babel loader. This loader is configured with the following
presets:

- `env`   - Adds all plugins that are considered `latest`.
- `react` - Adds all plugins required to support React.

We have also added the following plugins:

- `syntax-dynamic-import`        - Allows us to take advantage of Webpacks support for dynamic
                                   imports.
- `syntax-optional-chaining`     - Allows usage of optional chaining operator (?.)
- `transform-decorators-legacy`  - With complex React applications decoraters help to reduce
                                   boilerplate.
- `transform-class-properties`   - Makes defining the initial state easy.
- `transform-object-rest-spread` - We have it for arrays, we like it with objects as well.
- `transform-async-to-generator` - Async await can help make code more readable.
- `transform-runtime`            - This is only used for generator functions. Note that we only
                                   added this to support async/await.

#### `*.js (if not matched by another pattern)`

In practice this is javascript from `node_modules`. This is not processed by a loader and handled
directly by Webpack.

#### `*.svg#fragment`

This is handled by our own fragment loader. No optimization is performed on the svg.

#### `*.svg`

Optimized using the `image-webpack-loader` and inlined if the size is less than 5000 bytes.

#### `*.jpg, *.jpeg, *.png and *.gif`

These files are first processed by the `image-maxsize-webpack-loader` which allows for resizing at
load time. It is then optimized using the `image-webpack-loader` (only if `NODE_ENV=production`) and
inlined if the size is less than 5000 bytes.

#### The rest

All other files are loaded using the `file-loader`.

### Plugins

Webpack allows plugins to change its default behavior and add additional features.
We use quite a range of plugins and depending on the Webpack `target` (`node` or `web`) a plugin is
enabled.

#### ProgressBarPlugin

`node` and `web` - It show's the progress of the current build.

#### websocketCommunicationPlugin

`node` and `web` - A custom plugin that is only used for the `kaliber-watch` command. Is used to
provide other plugins with a websocket to communicate with the client.

#### makeAdditionalEntriesPlugin

`node` and `web` - A custom plugin that allows other modules to add new entries at the correct stage
of the build. It also allows plugins to 'claim' entries in order for them not to be processed by
the default process.

#### CaseSensitivePathsPlugin

`node` and `web` - Enforces case sensitive paths in Webpack requires to help the Mac users that are
too lazy to store their code on a case sensitive partition.

#### DefinePlugin

`node` and `web` - Allows the definition of constants at build time. We currently provide the
following constants:

- `process.env.NODE_ENV` - The value of `NODE_ENV`
- `process.env.WATCH`    - Is set to `true` when using the `kaliber-watch` command

#### ProvidePlugin

`node` and `web` - Never type the following imports:

- `import React from 'react'`
- `import { Component } from 'react'`

They are provided.

#### sourceMapPlugin

`node` and `web` - Custom plugin that creates real source maps when available.

#### TimeFixPlugin

`node` - You don't want to know.

#### ExtendedAPIPlugin

`node` - Provides `__webpack_chunk_name__` and `__webpack_hash__` variables.

#### configLoaderPlugin

`node` - Custom plugin that allows you to import `@kaliber/config`.

#### watchContextPlugin

`node` - Custom plugin that ensures all files in `src/` are watched for changes.

#### reactUniversalPlugin

`node` - Custom plugin that is responsible for spawning a `web` compiler that is used for compiling
`*.entry.js` and `*.js?universal` resources.

When it encounters a universal resource, the resource is duplicated and compiled by both the `node`
and the `web` compiler. It's quite performant because it reuses any non-js module that was already
compiled with the `node` compiler.

It is also responsible for providing the `entry-manifest.json` file.

#### templatePlugin

`node` - Custom plugin that allows for configured template renderes to render static and dynamic
templates that follow the `{name}.{type}.{ext}` file name pattern.

#### mergeCssPlugin

`node` - Custom plugin that merges CSS and also splits chunks for shared CSS files. It is also
responsible for providing the `css-manifest.json` file.

#### copyUnusedFilesPlugin

`node` - Custom plugin that copies all unused files in `src/` to `target/`.

#### hotCssReplacementPlugin

`node` - Custom plugin that is only used for the `kaliber-watch` command that communicates CSS
changes to the client.

#### chunkManifestPlugin

`web` - Custom plugin responsible for providing the `chunk-manifest.json` file.

#### hotModuleReplacementPlugin

`web` - Custom plugin that is only used for the `kaliber-watch` command that communicates javascript
changes to the client.

#### SplitChunksPlugin

`web` - Supplied by Webpack, splits shared chunks into bundles.

#### UglifyJsPlugin

`web` - Only used when `NODE_ENV=production`, minifies the javascript and removes unused code.

### Resolver plugins

Webpack allows custom resolvers to influence the way files are resolved. Only `*.js` resources can
be loaded without adding an extension. All other types of resources need to be imported using their
extension.

Also note that we only use `node_modules` as module directory.

#### absolutePathResolverPlugin

Custom resolver that allows absolute imports where `/` indicates the `src/` directory.

#### fragmentResolverPlugin

Custom resolver that allows imports of files including a fragment, for example: `johny.svg#head`.
