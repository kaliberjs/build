const loaderUtils = require('loader-utils')
const postcss = require('postcss')
const { relative, dirname } = require('path')

const isProduction = process.env.NODE_ENV === 'production'

function createPlugins(loaderOptions, { onExport, resolve, processUrl }) {
  const { minifyOnly = false, globalScopeBehaviour = false } = loaderOptions

  return [
    // these plugis need to run on each file individual file
    // look at the source of postcss-modules to see that it effectively runs all modules twice
    !minifyOnly && require('../postcss-plugins/postcss-plugin-composition')([
      // postcss-import is advised to be the first
      require('postcss-import')({ glob: true, resolve }),
      require('postcss-apply')(), // https://github.com/kaliberjs/build/issues/34
      require('postcss-modules')({
        scopeBehaviour: globalScopeBehaviour ? 'global' : 'local',
        getJSON: (_, json) => { onExport(json) },
        generateScopedName: isProduction ? '[hash:base64:5]' : '[folder]-[name]-[local]__[hash:base64:5]'
      })
    ]),
    // these plugins need to run on final result (note, they may still be merged with other files by the merge css plugin)
    !minifyOnly && require('../postcss-plugins/postcss-url-replace')({ replace: (url, file) => processUrl(url, file) }),
    !minifyOnly && require('postcss-cssnext'),
    isProduction && require('cssnano')({ preset: ['default', { cssDeclarationSorter: false }] })
  ].filter(Boolean)
}

module.exports = function CssLoader(source, map) {

  const self = this
  const callback = this.async()

  let exports = {}
  const handlers = {
    resolve: (id, basedir, importOptions) => resolve(basedir, id),
    onExport: locals => { exports = locals },
    processUrl: (url, file) => isDependency(url)
      ? resolve(dirname(file), url).then(resolved =>
          loadModule(resolved).then(executeModuleAt(resolved))
        )
      : Promise.resolve(url)
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

  function resolve(context, request) {
    return new Promise((resolve, reject) => {
      self.resolve(context, request, (err, result) => { err ? reject(err) : resolve(result) })
    }).catch(e => { callback(e) }) // this should not be required, by it seems postcss-plugin-composition does not pass along 'warnings' (more commonly known as 'errors')
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
