const { addBuiltInVariable, createChildCompiler } = require('../lib/webpack-utils')
const { relative } = require('path')
const makeAdditionalEntries = require('./make-additional-entries-plugin')
const chunkManifestPlugin = require('./chunk-manifest-plugin')

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
  /** @param {import('webpack').Compiler} compiler */
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {
      normalModuleFactory.hooks.afterResolve.tap(p, data => {
        const { resourceResolveData: { query }, loaders } = data.createData

        if (query === '?webworker') loaders.push({
          loader: webworkerClientLoaderPath,
          options: {},
          type: undefined,
          ident: 'added by webWorkerPlugin because of ?webworker',
        })
      })
    })
  }
}

function webWorkerPlugin(webWorkerCompilerOptions) {

  return {
    /** @param {import('webpack').Compiler} compiler */
    apply: compiler => {
      // keep a record of web worker entries for additional compiler runs (watch)
      const claimedEntries = {}

      // TODO: we might need to close the compiler
      const subCompiler = createChildCompiler(p, compiler, webWorkerCompilerOptions, { makeAdditionalEntries, chunkManifestPlugin }, 'webWorker')

      // when the subCompiler starts compiling add the recorded client entries
      makeAdditionalEntries.getHooks(subCompiler)
        .makeAdditionalEntries.tapPromise(p, (compilation, addEntries) => {
          return addEntries(claimedEntries)
        })

      /*
        When a module marked with `?webworker` has been resolved, add the `web-worker-client-loader` to it's
        loaders and add the module as entry.
      */
      compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {

        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          const { loaders, resourceResolveData: { query, path } } = data.createData

          if (query === '?webworker') {
            loaders.push({
              loader: webworkerClientLoaderPath,
              type: undefined,
              ident: 'added by webWorkerPlugin because of ?webworker',
              options: {},
            })
            const name = relative(compiler.context, path)
            if (!claimedEntries[name]) claimedEntries[name] = './' + name
          }
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
          createValue: (chunk) => {
            // get the manifest from the child compilation
            const [{ _kaliber_chunk_manifest_: manifest }] = compilation.children
            return manifest
          }
        })
      })
    }
  }
}
