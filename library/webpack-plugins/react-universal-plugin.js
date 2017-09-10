const Compiler = require('webpack/lib/Compiler')
const NodeEnvironmentPlugin = require('webpack/lib/node/NodeEnvironmentPlugin')
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

      const webCompiler = createWebCompiler(compiler, () => clientEntries)

      // `make` all `originalEntries` and add `clientEntries` when they have been recorded
      compiler.plugin('make-additional-entries', (compilation, createEntries, done) => {

        // setting parentCompilation can easily break on future webpack versions as it's an implementation detail
        //
        // Compiler.createChildComponent proved to be unusable. A safer option might be to implement
        // Compuler.runAsChild as well, in that case however we should override the Compiler.isChild
        // function for the webCompiler. For now this is easier
        webCompiler.parentCompilation = compilation
        webCompiler.runAsChild(done)
      })

      webCompiler.plugin('compilation', (compilation, { normalModuleFactory }) => {
        // push the client loader when appropriate
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
              if (assetName != name) delete compilation.assets[assetName]
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
  options.target = 'web'
  options.entry = undefined
  options.externals = undefined

  options.output = Object.assign({}, options.output)
  options.output.libraryTarget = 'var'

  options.resolve = Object.assign({}, options.resolve)
  options.resolve.aliasFields = ["browser"]
  options.resolve.mainFields = ["browser", "module", "main"]
  
  return createChildCompiler(compiler, options, 'react-universal-plugin-client-compiler')
}

function createChildCompiler(compiler, options, compilerName) {
  const childCompiler = new Compiler()
  childCompiler.name = compilerName

  // from webpack.js
  childCompiler.context = options.context
  childCompiler.options = options
  new NodeEnvironmentPlugin().apply(childCompiler)
  childCompiler.apply.apply(childCompiler, options.plugins)
  childCompiler.applyPlugins('environment')
  childCompiler.applyPlugins('after-environment')
  childCompiler.options = new WebpackOptionsApply().process(options, childCompiler)

  // from Compiler.createChildCompiler
  //   mofied so we do not need an index and thus don't need to rely on the compilation
  const relativeCompilerName = relative(compiler.context, compilerName)
  if(!compiler.records[relativeCompilerName]) compiler.records[relativeCompilerName] = {}

  childCompiler.records = compiler.records[relativeCompilerName]

  if(compiler.cache) {
    if(!compiler.cache.children) compiler.cache.children = {}
    if(!compiler.cache.children[compilerName]) compiler.cache.children[compilerName] = {}
    childCompiler.cache = compiler.cache.children[compilerName]
  }

  return childCompiler
}
