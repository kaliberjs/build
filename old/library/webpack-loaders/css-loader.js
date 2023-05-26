const loaderUtils = require('loader-utils')
const postcss = require('postcss')
const { relative, dirname } = require('path')
const genericNames = require('generic-names')
const { findCssGlobalFiles } = require('../lib/findCssGlobalFiles')
const vm = require('vm')

const isProduction = process.env.NODE_ENV === 'production'

function createPlugins(
  { minifyOnly, globalScopeBehaviour, nativeCustomProperties, cssGlobalFiles },
  { resolveForImport, resolveForUrlReplace, resolveForImportExportParser }
) {

  return [
    ...(minifyOnly
      ? []
      : [
        // postcss-import is advised to be the first
        require('postcss-import')({ glob: true, resolve: resolveForImport }),
        require('postcss-apply')(), // https://github.com/kaliberjs/build/issues/34
        require('postcss-modules-values'),
        require('postcss-preset-env')({
          features: {
            'custom-properties': !nativeCustomProperties && { preserve: false, importFrom: cssGlobalFiles },
            'custom-media-queries': { preserve: false, importFrom: cssGlobalFiles },
            'custom-selectors': { preserve: false, importFrom: cssGlobalFiles },
            'media-query-ranges': true,
            'nesting-rules': true,
            'hexadecimal-alpha-notation': true,
            'color-functional-notation': true,
            'font-variant-property': true,
            'all-property': true,
            'any-link-pseudo-class': true,
            'matches-pseudo-class': true,
            'not-pseudo-class': true,
            'overflow-wrap-property': true,
          },
        }),

        // no support for css-modules feature 'composes'
        !globalScopeBehaviour && require('postcss-modules-local-by-default')(),
        require('postcss-modules-scope')({ generateScopedName: genericNames(isProduction ? '[hash]' : '[folder]-[name]-[local]__[hash]') }),
        require('postcss-calc')(),
        require('../postcss-plugins/postcss-import-export-parser')({ loadExports: resolveForImportExportParser }),

        require('../postcss-plugins/postcss-url-replace')({ replace: resolveForUrlReplace }),
        require('../postcss-plugins/postcss-kaliber-scoped')(),
      ].filter(Boolean)
    ),
    isProduction && require('cssnano')({ preset: ['default', { svgo: false, cssDeclarationSorter: false }] })
  ].filter(Boolean)
}

/** @type {import('webpack').LoaderDefinitionFunction} */
module.exports = function CssLoader(source, map) {

  const self = this
  const callback = this.async()

  const loaderOptions = loaderUtils.getOptions(this) || {}
  const { minifyOnly = false, globalScopeBehaviour = false, nativeCustomProperties = false } = loaderOptions

  const cssGlobalFiles = cachedFindCssGlobalFiles(this)
  cssGlobalFiles.forEach(x => this.addDependency(x))

  const plugins = getPlugins(this, { minifyOnly, globalScopeBehaviour, nativeCustomProperties, cssGlobalFiles })
  const filename = relative(this.rootContext, this.resourcePath)
  const options = {
    from: this.resourcePath,
    to  : this.resourcePath,
    map : { prev: map || false, inline: false, annotation: false }
  }

  if (!plugins.length) return emitAndCallback({
    css: source,
    map,
    value: cssHash => `// no postcss plugins, no exports available ${cssHash}`
  })

  const result = postcss(plugins).process(source, options)
  result
    .then(({ css, map, messages }) => {
      throwErrorForWarnings(filename, result.warnings())

      messages
        .filter(({ type }) => type === 'dependency')
        .forEach(x => self.addDependency(x.file))

      const exports = messages
        .filter(({ type }) => type === 'export')
        .reduce((result, { item }) => ({ ...result, [item.key]: item.value }), {})

      emitAndCallback({
        css,
        map: map.toJSON(),
        value: cssHash => loaderOptions.globalScopeBehaviour || loaderOptions.minifyOnly
          ? `// postcss-modules is disabled, no exports available ${cssHash}`
          : { ...exports, cssHash }
      })
    })
    .catch(e => { callback(e) })

  function emitAndCallback({ css, map, value }) {
    self.emitFile(filename, css, map)
    const cssHash = require('crypto').createHash('md5').update(css).digest('hex')
    callback(null, value(cssHash))
  }
}

function getPlugins(loaderContext, { minifyOnly, globalScopeBehaviour, nativeCustomProperties, cssGlobalFiles }) {
  const key = `plugins${minifyOnly ? '-minifyOnly' : ''}${globalScopeBehaviour ? '-globalScope' : ''}`

  return cachedInCompilation(loaderContext, key, () => {
    const handlers = createHandlers(loaderContext)
    const plugins = createPlugins({ minifyOnly, globalScopeBehaviour, nativeCustomProperties, cssGlobalFiles }, handlers)
    return plugins
  })
}

/** @param {import('webpack').LoaderContext<any>} loaderContext */
function createHandlers(loaderContext) {
  return {
    resolveForImport: (id, basedir, importOptions) => resolve(basedir, id),
    resolveForUrlReplace: (url, file) => isDependency(url)
      ? resolveAndExecute(dirname(file), url)
      : Promise.resolve(url),
    resolveForImportExportParser: (url, file) => resolveAndExecute(dirname(file), url),
  }

  async function resolveAndExecute(context, request) {
    const resolved = await resolve(context, request)
    const source = await loadModule(resolved)
    return executeModuleAt(resolved, source)
  }

  async function resolve(context, request) {
    return new Promise((resolve, reject) => {
      loaderContext.resolve(context, request, (err, result) => { err ? reject(err) : resolve(result) })
    })
  }

  function loadModule(url) {
    return new Promise((resolve, reject) => {
      loaderContext.loadModule(url, (err, source) => { if (err) reject(err); else resolve(source) })
    })
  }

  function executeModuleAt(url, source) {
    const key = `module-${url}`
    return cachedInCompilation(loaderContext, key, () => {

      const sandbox = {
        module: {},
        __webpack_public_path__: loaderContext._compiler.options.output.publicPath || '/',
      }
      const result = vm.runInNewContext(source, sandbox, { displayErrors: true, contextName: `Execute ${url}` })
      return result
    })
  }
}

function cachedFindCssGlobalFiles(loaderContext) {
  return cachedInCompilation(loaderContext, 'global-css-files', () =>
    findCssGlobalFiles(loaderContext.rootContext)
  )
}

function cachedInCompilation(loaderContext, key, f) {
  const c = loaderContext._compilation
  const cache = c.kaliberCache || (c.kaliberCache = {})
  if (cache[key]) return cache[key]

  return (cache[key] = f())
}

function throwErrorForWarnings(filename, warnings) {
  if (warnings.length) throw new Error(warnings
    .sort(({ line: a = 0 }, { line: b = 0 }) => a - b)
    .map(warning => fileAndLine(warning) + warning.text).join('\n\n') + '\n'
  )

  function fileAndLine({ line }) {
    return filename + ((line || '') && (':' + line)) + '\n\n'
  }
}

function isDependency(s) { return !/^data:|^(https?:)?\/\/|^#.+/.test(s) }
