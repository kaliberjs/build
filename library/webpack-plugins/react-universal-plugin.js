const { addBuiltInVariable } = require('../lib/webpack-utils')
const { RawSource } = require('webpack-sources')
const { relative } = require('path')
const { ReplaceSource } = require('webpack-sources')
const Compiler = require('webpack/lib/Compiler')
const ImportDependency = require('webpack/lib/dependencies/ImportDependency')
const RawModule = require('webpack/lib/RawModule')
const Stats = require('webpack/lib/Stats')
const WebpackOptionsApply = require('webpack/lib/WebpackOptionsApply')
const WebpackOptionsDefaulter = require('webpack/lib/WebpackOptionsDefaulter')

/*
  The idea is simple:
    - record any dependencies marked with ?universal
    - add the server loader to those modules
    - compile those modules again as separate entries using a web targetted compiler
    - add the client loader to those modules
*/

const p = 'react-universal-plugin'

// works only when entry is an object
module.exports = function reactUniversalPlugin (webCompilerOptions) {

  return {
    apply: compiler => {
      // keep a record of client entries for additional compiler runs (watch)
      const clientEntries = {}

      const webCompiler = createWebCompiler(compiler, webCompilerOptions, () => clientEntries)

      // when the webCompiler starts compiling add the recorded client entries
      webCompiler.hooks.makeAdditionalEntries.tapPromise(p, (compilation, addEntries) => {
        return addEntries(clientEntries)
      })

      // check the parent compiler before creating a module, it might have already
      // been processed
      let compilation
      compiler.hooks.compilation.tap(p, c => { compilation = c })
      webCompiler.hooks.compilation.tap(p, (webCompilation, { normalModuleFactory }) => {
        normalModuleFactory.hooks.createModule.tap(p, data => {
          const { path } = data.resourceResolveData
          if (!path.endsWith('.js') && !path.endsWith('.json')) {
            const parentCompilationModule = compilation.findModule(data.request)
            if (parentCompilationModule) {
              const { dependencyTemplates, moduleTemplates } = webCompilation

              const generated = parentCompilationModule.generator.generate(
                parentCompilationModule,
                dependencyTemplates,
                moduleTemplates.javascript.runtimeTemplate
              )

              const result = new RawModule(generated.source(), data.request, data.rawRequest)
              result.updateCacheModule = function updateCacheModule(module) {
                result.sourceStr = module.source().source()
              }
              result.dependencies = parentCompilationModule.dependencies.slice()

              // These values are set by plugins like HarmonyDetectionParserPlugin and should be made available
              // on the raw module
              let { buildInfo = {}, buildMeta = {} } = result
              Object.defineProperty(result, 'buildInfo', {
                get() { return { ...parentCompilationModule.buildInfo, ...buildInfo, assets: {}, assetsInfo: [] } },
                set(x) { buildInfo = x }
              })
              Object.defineProperty(result, 'buildMeta', {
                get() { return { ...parentCompilationModule.buildMeta, ...buildMeta } },
                set(x) { buildMeta = x }
              })
              Object.defineProperty(result, 'exportsArgument', { get() { return parentCompilationModule.exportsArgument } })
              Object.defineProperty(result, 'moduleArgument', { get() { return parentCompilationModule.moduleArgument } })

              return result
            }
          }
        })
      })

      // before we compile, make sure the timestamps (important for caching and changed by watch) are updated
      compiler.hooks.beforeCompile.tap(p, params => {
        webCompiler.fileTimestamps = compiler.fileTimestamps
        webCompiler.contextTimestamps = compiler.contextTimestamps
      })

      // we claim entries ending with `entry.js` and record them as client entries for the web compiler
      compiler.hooks.claimEntries.tap(p, entries => {
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
      compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {

        normalModuleFactory.hooks.beforeResolve.tap(p, data => {
          if (!data) return data

          if (data.dependencies.some(x => x instanceof ImportDependency)) return

          return data
        })

        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          const { loaders, resourceResolveData: { query, path } } = data

          if (query === '?universal') {
            loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-server-loader') })

            const name = relative(compiler.context, path)
            if (!clientEntries[name]) clientEntries[name] = './' + name + '?universal-client'
          }

          if (path.endsWith('.entry.js')) {
            data.loaders = [{ loader: require.resolve('../webpack-loaders/ignore-content-loader') }]
          }

          return data
        })
      })

      // tell the web compiler to compile, emit the assets and notify the appropriate plugins
      // Note, we can not use `make` because it's parallel
      compiler.hooks.makeAdditionalEntries.tapAsync(p, (compilation, _, callback) => {

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
            webCompiler.hooks.failed.call(err)
            return callback(err)
          }

          const stats = new Stats(compilation)
          stats.startTime = startTime
          stats.endTime = Date.now()

          webCompiler.hooks.done.callAsync(stats, callback)
        }
      })

      // make sure the __webpack_js_chunk_information__ is available in modules
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {

        addBuiltInVariable({
          compilation, normalModuleFactory,
          pluginName: p,
          variableName: '__webpack_js_chunk_information__',
          abbreviation: 'jci',
          type: 'object',
          createValue: (source, chunk, hash) => {
            // get the manifest from the client compilation
            const [{ _kaliber_chunk_manifest_: manifest }] = compilation.children
            const javascriptChunkNames = getJavascriptChunkNames(chunk, compiler)
            return { javascriptChunkNames, manifest }
          }
        })

        compilation.hooks.additionalChunkAssets.tap(p, chunks => {
          const entryManifest = chunks
            .filter(x => x.name)
            .reduce((result, x) => {
              const names = getJavascriptChunkNames(x, compiler)
              return names.length ? { ...result, [x.name]: names } : result
            }, {})

          compilation.assets['entry-manifest.json'] = new RawSource(JSON.stringify(entryManifest, null, 2))
        })
      })
    }
  }
}

function getJavascriptChunkNames(chunk, compiler) {
  // find univeral modules in the current chunk (client chunk names) and grab their filenames (uniquely)
  return chunk.getModules()
    .filter(x => x.resource && (x.resource.endsWith('?universal') || x.resource.endsWith('.entry.js')))
    .map(x => relative(compiler.context, x.resource.replace('?universal', '')))
}

function createWebCompiler(compiler, options, getEntries) {

  const webCompiler = createCompiler(compiler, options)

  /*
    push the client loader when appropriate

    provide a friendly error if @kaliber/config is loaded from a client module
  */
  webCompiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {
    normalModuleFactory.hooks.afterResolve.tap(p, data => {
      const { loaders, rawRequest, resourceResolveData: { query } } = data

      if (query === '?universal-client')
        loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-client-loader') })

      if (rawRequest === '@kaliber/config')
        throw new Error('@kaliber/config\n------\nYou can not load @kaliber/config from a client module.\n\nIf you have a use-case, please open an issue so we can discuss how we can\nimplement this safely.\n------')

      return data
    })
  })

  // make the chunk manifest available
  webCompiler.hooks.compilation.tap(p, compilation => {
    compilation.hooks.chunkManifest.tap(p, chunkManifest => {
      compilation._kaliber_chunk_manifest_ = chunkManifest
    })
  })

  return webCompiler
}

function createCompiler(compiler, options) {
  /* from lib/webpack.js */
  options = new WebpackOptionsDefaulter().process(options)

  const childCompiler = new Compiler(options.context)
  childCompiler.options = options

  // instead of using the NodeEnvironmentPlugin
  childCompiler.inputFileSystem = compiler.inputFileSystem
  childCompiler.outputFileSystem = compiler.outputFileSystem
  childCompiler.watchFileSystem = compiler.watchFileSystem

  options.plugins.forEach(plugin => { plugin.apply(childCompiler) })
  childCompiler.hooks.environment.call()
  childCompiler.hooks.afterEnvironment.call()
  childCompiler.options = new WebpackOptionsApply().process(options, childCompiler)

  return childCompiler
}
