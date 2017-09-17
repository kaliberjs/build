const Compiler = require('webpack/lib/Compiler')
const ImportDependency = require('webpack/lib/dependencies/ImportDependency')
const Stats = require('webpack/lib/Stats')
const WebpackOptionsApply = require('webpack/lib/WebpackOptionsApply')
const { relative } = require('path')

/*
  The idea is simple:
    - record any dependencies marked with ?universal
    - add the server loader to those modules
    - compile those modules again as separate entries using a web targetted compiler  
*/

// works only when entry is an object
module.exports = function reactUniversalPlugin () {

  return {
    apply: compiler => {
      // keep a record of client entries for additional compiler runs (watch)
      const clientEntries = {}

      const webCompiler = createWebCompiler(compiler, () => clientEntries)

      compiler.plugin('before-compile', (params, done) => {
        webCompiler.fileTimestamps = compiler.fileTimestamps
        webCompiler.contextTimestamps = compiler.contextTimestamps
        done()
      })

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

      compiler.plugin('normal-module-factory', normalModuleFactory => {
        normalModuleFactory.plugin('before-resolve', (data, done) => {
          if (!data) return done(null, data)

          if (data.dependencies.some(x => x instanceof ImportDependency)) return done()

          done(null, data)
        })

        // When a module marked with `?universal` has been resolved, add the `react-universal-server-loader` to it's
        // loaders and add the module marked with `?universal-client` as client entry.
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

      // `make` all `originalEntries` and add `clientEntries` when they have been recorded
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

      const removedAssets = []

      webCompiler.plugin('normal-module-factory', normalModuleFactory => {
        // push the client loader when appropriate
        normalModuleFactory.plugin('after-resolve', (data, done) => {
          const { loaders, rawRequest, resourceResolveData: { query } } = data

          if (query === '?universal-client')
            loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-client-loader') })

          if (rawRequest === '@kaliber/config')
            return done('@kaliber/config\n------\nYou can not load @kaliber/config from a client module.\n\nIf you have a use-case, please open an issue so we can discuss how we can\nimplement this safely.\n------')

          done(null, data)
        })
      })

      webCompiler.plugin('compilation', compilation => {

        // remove redundant assets introduced by client chunk
        compilation.plugin('after-optimize-chunk-assets', chunks => {

          const chunkFiles = {}
          chunks.forEach(({ files }) => { files.forEach(file => { chunkFiles[file] = true }) })
          Object.keys(compilation.assets).forEach(assetName => {
              if (!chunkFiles[assetName] && !assetName.includes('hot-update')) {
                removedAssets.push(assetName)
                delete compilation.assets[assetName]
              }
            })
        })
      })

      webCompiler.plugin('make-additional-entries', (compilation, createEntries, done) => {
        createEntries(clientEntries, done)
      })

      webCompiler.plugin('after-emit', (compilation, done) => {
        removedAssets.forEach(asset => {
          compilation.assets[asset] = { size: () => 0, emitted: false }
        })
        done()
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

  options.resolve = Object.assign({}, options.resolve)
  options.resolve.aliasFields = ["browser"]
  options.resolve.mainFields = ["browser", "module", "main"]

  return createCompiler(compiler, options)
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
