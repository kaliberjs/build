const loaderUtils = require('loader-utils')
const postcss = require('postcss')
const { relative, dirname } = require('path')
const genericNames = require('generic-names')
const { findCssGlobalFiles } = require('../lib/findCssGlobalFiles')

const isProduction = process.env.NODE_ENV === 'production'

function createPlugins(loaderOptions, { resolveForImport, resolveForUrlReplace, resolveForImportExportParser, cssGlobalFiles }) {
  const { minifyOnly = false, globalScopeBehaviour = false } = loaderOptions
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
            'custom-properties': { preserve: false, importFrom: cssGlobalFiles },
            'custom-media-queries': { preserve: false, importFrom: cssGlobalFiles },
            'custom-selectors': { preserve: false, importFrom: cssGlobalFiles },
            'media-query-ranges': true,
            'nesting-rules': true,
            'color-functional-notation': true,
            'color-mod-function': true,
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
        require('postcss-modules-scope')({ generateScopedName: genericNames(isProduction ? '[hash:base64:5]' : '[folder]-[name]-[local]__[hash:base64:5]') }),
        require('postcss-calc')(),
        require('../postcss-plugins/postcss-import-export-parser')({ loadExports: resolveForImportExportParser }),

        require('../postcss-plugins/postcss-url-replace')({ replace: resolveForUrlReplace }),
      ].filter(Boolean)
    ),
    isProduction && require('cssnano')({ preset: ['default', { cssDeclarationSorter: false }] })
  ].filter(Boolean)
}

module.exports = function CssLoader(source, map) {

  const self = this
  const callback = this.async()

  const handlers = {
    resolveForImport: (id, basedir, importOptions) => resolve(basedir, id),
    resolveForUrlReplace: (url, file) => isDependency(url)
      ? resolveAndExecute(dirname(file), url)
      : Promise.resolve(url),
    resolveForImportExportParser: url => resolveAndExecute(this.context, url),
    cssGlobalFiles: findCssGlobalFiles(this.context),
  }

  const loaderOptions = loaderUtils.getOptions(this) || {}
  const plugins = createPlugins(loaderOptions, handlers)
  const filename = relative(this.rootContext, this.resourcePath)
  const options = {
    from: this.resourcePath,
    to  : this.resourcePath,
    map : { prev: map || false, inline: false, annotation: false }
  }

  const result = postcss(plugins).process(source, options)
  result
    .then(({ css, map, messages }) => {
      throwErrorForWarnings(result.warnings())

      messages
        .filter(({ type }) => type === 'dependency')
        .forEach(x => self.addDependency(x.file))

      const exports = messages
        .filter(({ type }) => type === 'export')
        .reduce((result, { item }) => ({ ...result, [item.key]: item.value }), {})

      this.emitFile(filename, css, map.toJSON())

      const cssHash = require('crypto').createHash('md5').update(css).digest('hex')

      if (loaderOptions.globalScopeBehaviour) {
        callback(null, `// postcss-modules is disabled, no exports available ${cssHash}`)
      } else {
        exports.cssHash = cssHash
        callback(null, exports)
      }
    })
    .catch(e => { callback(e) })

  function resolveAndExecute(context, request) {
    return resolve(context, request).then(resolved =>
      loadModule(resolved).then(executeModuleAt(resolved))
    )
  }

  function resolve(context, request) {
    return new Promise((resolve, reject) => {
      self.resolve(context, request, (err, result) => { err ? reject(err) : resolve(result) })
    })
  }

  function loadModule(url) {
    return new Promise((resolve, reject) => {
      self.loadModule(url, (err, source) => { if (err) reject(err); else resolve(source) })
    })
  }

  function executeModuleAt(url) {
    return source => {
      const completeSource = `const __webpack_public_path__ = '${self._compiler.options.output.publicPath || '/'}'\n` + source
      return self.exec(completeSource, url)
    }
  }

  function throwErrorForWarnings(warnings) {
    if (warnings.length) throw new Error(warnings
      .sort(({ line: a = 0 }, { line: b = 0}) => a - b)
      .map(warning => fileAndLine(warning) + warning.text).join('\n\n') + '\n'
    )

    function fileAndLine({ line }) {
      return filename + ((line || '') && (':' + line)) + '\n\n'
    }
  }
}

function isDependency(s) { return !/^data:|^(https?:)?\/\/|^#.+/.test(s) }
