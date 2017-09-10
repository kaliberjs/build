const Compiler = require('webpack/lib/Compiler')
const NodeEnvironmentPlugin = require('webpack/lib/node/NodeEnvironmentPlugin')
const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const WebpackOptionsApply = require('webpack/lib/WebpackOptionsApply')
const { ResolverFactory } = require("enhanced-resolve")
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
      let originalEntries
      // keep a record of additional entries for additional compiler runs (watch)
      const clientEntries = []

      const webCompiler = createWebCompiler(compiler, () => clientEntries)

      // claim and record the entries in the `entry` if it's object shaped
      compiler.plugin("entry-option", (context, entry) => {
        if(typeof entry === "object" && !Array.isArray(entry)) {
          originalEntries = Object.keys(entry).map(name => SingleEntryPlugin.createDependency(entry[name], name))
          return true
        }
      })

      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {

        // make sure the SingleEntryDependency has a factory
        compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory)

        // When a module marked with `?universal` has been resolved, add the `react-universal-server-loader` to it's
        // loaders and add the module marked with `?universal-client` as client entry.
        normalModuleFactory.plugin('after-resolve', (data, done) => {
          const { loaders, resourceResolveData: { query, path } } = data
          if (query === '?universal') {
            loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-server-loader') })

            const name = relative(compiler.context, path)
            const dep = SingleEntryPlugin.createDependency('./' + name + '?universal-client', name)
            const duplicate = clientEntries.find(({ loc, request }) => loc === dep.loc && request === dep.request)
            if (!duplicate) clientEntries.push(dep)

          }
          done(null, data)
        })
      })

      // `make` all `originalEntries` and add `clientEntries` when they have been recorded
      compiler.plugin('make', (compilation, done) => {

        Promise.all(originalEntries.map(addEntry(compilation, compiler.context)))
          .then(compileClientEntries)
          .then(_ => { done() })
          .catch(e => { done(e) })

        function compileClientEntries() {
          return new Promise((resolve, reject) => {
            // setting parentCompilation can easily break on future webpack versions as it's an implementation detail
            //
            // Compiler.createChildComponent proved to be unusable. A safer option might be to implement
            // Compuler.runAsChild as well, in that case however we should override the Compiler.isChild
            // function for the webCompiler. For now this is easier
            webCompiler.parentCompilation = compilation
            webCompiler.runAsChild((err, chunks, compilation) => {
              err ? reject(err) : resolve()
            })
          })
        }
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
  
  const webCompiler = createChildCompiler(compiler, options, 'react-universal-plugin-client-compiler')

  webCompiler.plugin('compilation', (compilation, { normalModuleFactory }) => {

    // make sure the SingleEntryDependency has a factory
    compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory)
    
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

  webCompiler.plugin('make', (compilation, done) => {
    Promise.all(getEntries().map(addEntry(compilation, webCompiler.context)))
      .then(_ => { done() })
      .catch(e => { done(e) })
  })

  return webCompiler
}

function addEntry(compilation, context) {
  return entry => new Promise((resolve, reject) => {
    compilation.addEntry(context, entry, entry.loc, err => err ? reject(err) : resolve())
  })
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
