const Compiler = require('webpack/lib/Compiler')
const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const ImportDependency = require('webpack/lib/dependencies/ImportDependency')
const NullFactory = require('webpack/lib/NullFactory')
const ParserHelpers = require('webpack/lib/ParserHelpers')
const Stats = require('webpack/lib/Stats')
const WebpackOptionsApply = require('webpack/lib/WebpackOptionsApply')
const { relative } = require('path')

/*
  The idea is simple:
    - record any dependencies marked with ?universal
    - add the server loader to those modules
    - compile those modules again as separate entries using a web targetted compiler
    - add the client loader to those modules
*/

// works only when entry is an object
module.exports = function reactUniversalPlugin () {

  return {
    apply: compiler => {
      // keep a record of client entries for additional compiler runs (watch)
      const clientEntries = {}

      const webCompiler = createWebCompiler(compiler, () => clientEntries)

      // when the webCompiler starts compiling add the recorded client entries
      webCompiler.plugin('make-additional-entries', (compilation, createEntries, done) => {
        createEntries(clientEntries, done)
      })

      // before we compile, make sure the timestamps (important for caching and changed by watch) are updated
      compiler.plugin('before-compile', (params, done) => {
        webCompiler.fileTimestamps = compiler.fileTimestamps
        webCompiler.contextTimestamps = compiler.contextTimestamps
        done()
      })

      // we claim entries ending with `entry.js` and record them as client entries for the web compiler
      compiler.plugin('claim-entries', entries => {
        const [claimed, unclaimed] = Object.keys(entries).reduce(
          ([claimed, unclaimed], name) => {
            const entry = entries[name]
            if (entry.endsWith('.entry.js')) claimed[name] = entry
            else unclaimed[name] = entry

            return [claimed, unclaimed]
          },
          [{}, {}]
        )

        Object.assign(clientEntries, claimed)

        return unclaimed
      })

      /*
        Prevent the usage of dynamic imports in server sided code, this could be problematic as both versions could
        have the same name.

        When a module marked with `?universal` has been resolved, add the `react-universal-server-loader` to it's
        loaders and add the module marked with `?universal-client` as client entry.
      */
      compiler.plugin('normal-module-factory', normalModuleFactory => {

        normalModuleFactory.plugin('before-resolve', (data, done) => {
          if (!data) return done(null, data)

          if (data.dependencies.some(x => x instanceof ImportDependency)) return done()

          done(null, data)
        })

        normalModuleFactory.plugin('after-resolve', (data, done) => {
          const { loaders, resourceResolveData: { query, path } } = data

          if (query === '?universal') {
            loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-server-loader') })

            const name = relative(compiler.context, path)
            if (!clientEntries[name]) clientEntries[name] = './' + name + '?universal-client'
          }

          done(null, data)
        })
      })

      // tell the web compiler to compile, emit the assets and notify the appropriate plugins
      compiler.plugin('make-additional-entries', (compilation, createEntries, done) => {

        const startTime = Date.now()
        webCompiler.compile((err, webCompilation) => {
          if (err) return finish(err)

          compilation.children.push(webCompilation)

          webCompiler.emitAssets(webCompilation, err => {
            if (err) return finish(err)

            finish(null, webCompilation)
          })
        })

        function finish(err, compilation) {
          if (err) {
            webCompiler.applyPlugins('failed', err)
            return done(err)
          }

          const stats = new Stats(compilation)
          stats.startTime = startTime
          stats.endTime = Date.now()

          webCompiler.applyPlugins('done', stats)

          done()
        }
      })

      // make sure the __webpack_js_client_chunk_files__ is available in modules (code copied from ExtendedApiPlugin)
      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(ConstDependency, new NullFactory())
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())
        compilation.mainTemplate.plugin('require-extensions', function(source, chunk, hash) {

          // find univeral modules in the current chunk (client chunk names)
          const clientChunkNames = chunk.getModules()
            .filter(x => x.resource && x.resource.endsWith('?universal'))
            .map(x => relative(compiler.context, x.resource.replace('?universal', '')))

          // grab their filenames (uniquely)
          const jsClientChunkFiles = compilation.children.reduce(
            (result, { _kaliber_chunk_manifest_: manifest }) => {
              clientChunkNames.forEach(clientChunkName => {
                const childChunk = manifest[clientChunkName]
                addFilenames(childChunk)
              })

              function addFilenames({ filename, hasRuntime, parents }) {
                parents.map(x => manifest[x]).forEach(addFilenames)
                if (!result.includes(filename)) {
                  if (hasRuntime) result.unshift(filename)
                  else result.push(filename)
                }
              }

              return result
            },
            []
          )

          const buf = [
            source,
            '',
            '// __webpack_js_client_chunk_files__',
            `${this.requireFn}.jccf = ${JSON.stringify(jsClientChunkFiles)};`
          ]
          return this.asString(buf)
        })
        compilation.mainTemplate.plugin('global-hash', () => true)
        normalModuleFactory.plugin('parser', (parser, parserOptions) => {
          parser.plugin(`expression __webpack_js_client_chunk_files__`, ParserHelpers.toConstantDependency('__webpack_require__.jccf'))
          parser.plugin(`evaluate typeof __webpack_js_client_chunk_files__`, ParserHelpers.evaluateToString('array'))
        })
      })
    }
  }
}

function createWebCompiler(compiler, getEntries) {

  // Massage the options to become a web configuration
  const options = Object.assign({}, compiler.options)
  options.name = 'react-universal-plugin-client-compiler'
  options.target = 'web'
  options.entry = undefined
  options.externals = undefined

  options.output = Object.assign({}, options.output)
  options.output.libraryTarget = 'var'
  options.output.filename = '[id].[hash].js'

  options.resolve = Object.assign({}, options.resolve)
  options.resolve.aliasFields = ["browser"]
  options.resolve.mainFields = ["browser", "module", "main"]

  const webCompiler = createCompiler(compiler, options)

  const removedAssets = []

  /*
    push the client loader when appropriate

    provide a friendly error if @kaliber/config is loaded from a client module
  */
  webCompiler.plugin('normal-module-factory', normalModuleFactory => {
    normalModuleFactory.plugin('after-resolve', (data, done) => {
      const { loaders, rawRequest, resourceResolveData: { query } } = data

      if (query === '?universal-client')
        loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-client-loader') })

      if (rawRequest === '@kaliber/config')
        return done('@kaliber/config\n------\nYou can not load @kaliber/config from a client module.\n\nIf you have a use-case, please open an issue so we can discuss how we can\nimplement this safely.\n------')

      done(null, data)
    })
  })

  // remove redundant assets introduced by client chunk, keep hot update assets
  webCompiler.plugin('compilation', compilation => {

    compilation.plugin('after-optimize-chunk-assets', chunks => {
      const chunkFiles = {}
      chunks.forEach(({ files }) => { files.forEach(file => { chunkFiles[file] = true }) })
      Object.keys(compilation.assets).forEach(assetName => {
        // this should be solved with some smarter construction: https://github.com/kaliberjs/build/issues/58
        if (!chunkFiles[assetName] && !assetName.includes('hot-update') && assetName !== 'chunk-manifest.json') {
          removedAssets.push(assetName)
          delete compilation.assets[assetName]
        }
      })
    })

    compilation.plugin('chunk-manifest', chunkManifest => {
      compilation._kaliber_chunk_manifest_ = chunkManifest
    })
  })

  // report the removed assets
  webCompiler.plugin('after-emit', (compilation, done) => {
    removedAssets.forEach(asset => {
      compilation.assets[asset] = { size: () => 0, emitted: false }
    })
    done()
  })

  return webCompiler
}

function createCompiler(compiler, options) {
  const childCompiler = new Compiler()

  /* from webpack.js */
  childCompiler.context = options.context
  childCompiler.options = options

  // instead of using the NodeEnvironmentPlugin
  childCompiler.inputFileSystem = compiler.inputFileSystem
  childCompiler.outputFileSystem = compiler.outputFileSystem
  childCompiler.watchFileSystem = compiler.watchFileSystem

  childCompiler.apply.apply(childCompiler, options.plugins)
  childCompiler.applyPlugins('environment')
  childCompiler.applyPlugins('after-environment')
  childCompiler.options = new WebpackOptionsApply().process(options, childCompiler)

  return childCompiler
}
