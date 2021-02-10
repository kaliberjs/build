const { addBuiltInVariable, createChildCompiler } = require('../lib/webpack-utils')
const { relative } = require('path')

/*
  The idea is simple:
    - record any dependencies marked with ?webworker
    - add the client loader to those modules
    - compile those modules as separate entries using a `webworker` targetted compiler
*/
const p = 'web-worker-plugin'
const webworkerClientLoaderPath = require.resolve('../webpack-loaders/web-worker-client-loader')

module.exports = webWorkerPlugin

// use this plugin for the compile time and server-side renderer
webWorkerPlugin.handleWebWorkerImports = {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {
      normalModuleFactory.hooks.afterResolve.tap(p, data => {
        const { resourceResolveData: { query }, loaders } = data
        if (query === '?webworker') loaders.push({ loader: webworkerClientLoaderPath })
        return data
      })
    })
  }
}

function webWorkerPlugin(webWorkerCompilerOptions) {

  return {
    apply: compiler => {
      // keep a record of web worker entries for additional compiler runs (watch)
      const claimedEntries = {}

      const subCompiler = createSubCompiler(compiler, webWorkerCompilerOptions)

      // when the subCompiler starts compiling add the recorded client entries
      subCompiler.hooks.makeAdditionalEntries.tapPromise(p, (compilation, addEntries) => {
        return addEntries(claimedEntries)
      })

      /*
        When a module marked with `?webworker` has been resolved, add the `web-worker-client-loader` to it's
        loaders and add the module as entry.
      */
      compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {

        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          const { loaders, resourceResolveData: { query, path } } = data

          if (query === '?webworker') {
            loaders.push({ loader: webworkerClientLoaderPath })
            const name = relative(compiler.context, path)
            if (!claimedEntries[name]) claimedEntries[name] = './' + name
          }

          return data
        })
      })

      // make sure the __webpack_web_worker_chunk_manifest__ is available in modules
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {

        addBuiltInVariable({
          compilation, normalModuleFactory,
          pluginName: p,
          variableName: '__webpack_web_worker_chunk_manifest__',
          abbreviation: 'wwci',
          type: 'object',
          createValue: (source, chunk, hash) => {
            // get the manifest from the child compilation
            const [{ _kaliber_chunk_manifest_: manifest }] = compilation.children
            return manifest
          }
        })
      })
    }
  }
}

function createSubCompiler(compiler, options) {

  const subCompiler = createChildCompiler(p, compiler, options)

  // provide a friendly error if @kaliber/config is loaded from a client module
  subCompiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {
    normalModuleFactory.hooks.afterResolve.tap(p, data => {
      const { rawRequest } = data

      if (rawRequest === '@kaliber/config')
        throw new Error('@kaliber/config\n------\nYou can not load @kaliber/config from a client module.\n\nIf you have a use-case, please open an issue so we can discuss how we can\nimplement this safely.\n------')

      return data
    })
  })

  return subCompiler
}
