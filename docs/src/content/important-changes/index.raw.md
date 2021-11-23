## Important changes

{toc}

### Breaking changes

- v0.0.77 - css `color()` function is now `color-mod()`
- v0.0.71 - server side rendered polyfills (`withPolyfill`) have been removed
- v0.0.63 - `raw` is no longer accepted as a template type
- v0.0.60 - setting `CONFIG_ENV` is now required.
- v0.0.54 - `chunk-manifest.json` changed.
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

### New features

- v0.0.116 - Introduced `*.universal.js` and context handling across client/server boundary
- ? - `*.raw.*` sources are now loaded using the `raw-loader`
- v0.0.58 - `ExtendedAPIPlugin` is now also used in the web compiler
- v0.0.56 - all sub directories of `src/` are being watched
- v0.0.54 - universal components can be rendered more than once on the same page
