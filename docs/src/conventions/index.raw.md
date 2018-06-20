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

#### *.entry.js

This is used for plain-old javascript files. You would create this if your end-product is a
javascript file that would be loaded by some web framework.

In order to find out the compiled (fingerprinted) filename you need the contents of
`target/chunk-manifest.json`.

#### *.entry.css

This is used for plain-old CSS files. The difference with other CSS files (that are typically
imported from a javascript file) is that CSS modules are disabled. You would create this if the CSS
should apply to html created using another library or framework.

In order to find out the compiled (fingerprinted) filename you need the contents of
`target/css-manifest.json`.

#### *.{type}.js

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
