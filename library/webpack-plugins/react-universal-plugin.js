const Compiler = require('webpack/lib/Compiler')
const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const ImportDependency = require('webpack/lib/dependencies/ImportDependency')
const NullFactory = require('webpack/lib/NullFactory')
const ParserHelpers = require('webpack/lib/ParserHelpers')
const RawModule = require('webpack/lib/RawModule')
const Stats = require('webpack/lib/Stats')
const WebpackOptionsApply = require('webpack/lib/WebpackOptionsApply')
const { ReplaceSource } = require('webpack-sources')
const { relative } = require('path')
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
          const path = data.resourceResolveData.path
          if (!path.endsWith('.js') && !path.endsWith('.json')) {
            const parentCompilationModule = compilation.findModule(data.request)
            if (parentCompilationModule) {
              // mutation in webpack internals is a minefield, tread carefully
              const dependencies = parentCompilationModule.dependencies.slice()
              const parentSource = new ReplaceSource(parentCompilationModule.originalSource())

              const { dependencyTemplates, outputOptions, moduleTemplates: { javascript: { requestShortener } } } = webCompilation

              // from NormalModule.sourceDependency
              dependencies.forEach(dependency => {
                const template = dependencyTemplates.get(dependency.constructor)
                if (template) template.apply(dependency, parentSource, outputOptions, requestShortener, dependencyTemplates)
              })

              const result = new RawModule(parentSource.source())
              result.dependencies = dependencies
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

          return data
        })
      })

      // tell the web compiler to compile, emit the assets and notify the appropriate plugins
      // Note, we can not use `make` because it's parralel
      compiler.hooks.makeAdditionalEntries.tapAsync(p, (compilation, _, done) => {

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
            return done(err)
          }

          const stats = new Stats(compilation)
          stats.startTime = startTime
          stats.endTime = Date.now()

          webCompiler.hooks.done.callAsync(stats, done)
        }
      })

      // make sure the __webpack_js_chunk_information__ is available in modules (code copied from ExtendedApiPlugin)
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(ConstDependency, new NullFactory())
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())
        compilation.mainTemplate.hooks.requireExtensions.tap(p, function(source, chunk, hash) {

          // get the manifest from the client compilation
          const [{ _kaliber_chunk_manifest_: manifest }] = compilation.children

          // find univeral modules in the current chunk (client chunk names) and grab their filenames (uniquely)
          const universalChunkNames = chunk.getModules()
            .filter(x => x.resource && x.resource.endsWith('?universal'))
            .map(x => relative(compiler.context, x.resource.replace('?universal', '')))

          const buf = [
            source,
            '',
            '// __webpack_js_chunk_information__',
            `${compilation.mainTemplate.requireFn}.jci = ${JSON.stringify({ universalChunkNames, manifest })};`
          ]
          return buf.join('\n')
        })
        compilation.mainTemplate.hooks.globalHash.tap(p, () => true)
        normalModuleFactory.hooks.parser.for('javascript/auto').tap(p, addParserHooks)
        normalModuleFactory.hooks.parser.for('javascript/dynamic').tap(p, addParserHooks)

        function addParserHooks(parser, parserOptions) {
          parser.hooks.expression.for('__webpack_js_chunk_information__').tap(p, ParserHelpers.toConstantDependency(parser, '__webpack_require__.jci'))
          parser.hooks.evaluateTypeof.for('__webpack_js_chunk_information__').tap(p, ParserHelpers.evaluateToString('array'))
        }
      })
    }
  }
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
