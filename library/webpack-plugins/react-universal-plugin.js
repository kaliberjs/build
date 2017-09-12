const Compiler = require('webpack/lib/Compiler')
const NodeEnvironmentPlugin = require('webpack/lib/node/NodeEnvironmentPlugin')
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
      let lastWebCompilationStats = null

      compiler.plugin('before-compile', (params, done) => {
        webCompiler.fileTimestamps = compiler.fileTimestamps
        webCompiler.contextTimestamps = compiler.contextTimestamps
        done()
      })

      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {

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
          if (err) {
            webCompiler.applyPlugins("failed", err)
            return done(err)
          }

          compilation.children.push(webCompilation)
          Object.keys(webCompilation.assets).forEach(name => {
            compilation.assets[name] = webCompilation.assets[name]
          })

          const stats = new Stats(webCompilation)
          stats.startTime = startTime
          stats.endTime = Date.now()

          lastWebCompilationStats = stats

          done()
        })
      })

      compiler.plugin('after-emit', (compilation, done) => {
        webCompiler.applyPlugins('done', lastWebCompilationStats)
        lastWebCompilationStats = null
        done()
      })

      webCompiler.plugin('compilation', (compilation, { normalModuleFactory }) => {
        // push the client loader when appropriate
        // {{ QUESTION }}: is this plugin added more than once?
        normalModuleFactory.plugin('after-resolve', (data, done) => {
          const { loaders, resourceResolveData: { query } } = data
          if (query === '?universal-client') {
            loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-client-loader') })
          }

          done(null, data)
        })

        // remove redundant assets introduced by client chunk
        compilation.plugin('after-optimize-chunk-assets', chunks => {
          chunks.forEach(chunk => {
            const { name } = chunk
            Object.keys(compilation.assets).forEach(assetName => {
              if (assetName != name && !assetName.includes('hot-update')) {
                delete compilation.assets[assetName]
              }
            })
          })
        })
      })

      webCompiler.plugin('make-additional-entries', (compilation, createEntries, done) => {
        createEntries(clientEntries)
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
  
  return createChildCompiler(compiler, options)
}

function createChildCompiler(compiler, options) {
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
