const FunctionModulePlugin = require("webpack/lib/FunctionModulePlugin")
const JsonpTemplatePlugin = require("webpack/lib/JsonpTemplatePlugin")
const LoaderTargetPlugin = require("webpack/lib/LoaderTargetPlugin")
const NodeSourcePlugin = require("webpack/lib/node/NodeSourcePlugin")
const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const { ResolverFactory } = require("enhanced-resolve")
const { relative } = require('path')

function createDeferred() {
  let resolve
  let reject
  return {
    promise: new Promise((res, rej) => {
      resolve = res
      reject = rej
    }),
    resolve: (...args) => resolve(...args),
    reject: (...args) => reject(...args)
  }
}

// works only when entry is an object
module.exports = function reactUniversalPlugin () {

  // keep a record of additional entries for additional compiler runs (watch)
  const additionalEntries = []

  return {
    apply: compiler => {

      let initialEntries

      // claim and record the entries in the `entry` if it's object shaped
      compiler.plugin("entry-option", (context, entry) => {
        if(typeof entry === "object" && !Array.isArray(entry)) {
          initialEntries = Object.keys(entry).map(name => SingleEntryPlugin.createDependency(entry[name], name))
          return true
        }
      })

      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {

        // make sure the SingleEntryDependency has a factory
        compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory)

        // When a module marked with `?universal` has been resolved, add the `react-universal-server-loader` to it's
        // loaders and add the module marked with `?universal-client` as entry. When a module marked with
        // `?universal-client` has been resolved, add the `react-universal-client-loader` to it's loaders.
        normalModuleFactory.plugin('after-resolve', (data, done) => {
          const { loaders, resourceResolveData: { query, path } } = data
          if (query === '?universal') {
            loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-server-loader') })

            const name = relative(compiler.context, path)
            const dep = SingleEntryPlugin.createDependency('./' + name + '?universal-client', name)
            const duplicate = additionalEntries.find(({ loc, request }) => loc === dep.loc && request === dep.request)
            if (!duplicate) additionalEntries.push(dep)

          }// else if (query === '?universal-client') {
            //loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-client-loader') })
          //}
          done(null, data)
        })

        // mark client entry modules and provide `universal` variables
        // compilation.plugin('normal-module-loader', (context, module) => {
        //   module.universalClient = module.userRequest.endsWith('?universal-client')
        // })

        // remove redundant assets introduced by client chunk
        // compilation.plugin('after-optimize-chunk-assets', chunks => {
        //   chunks.forEach(chunk => {
        //     const { entryModule, files, name } = chunk
        //     if (entryModule.universalClient) {
        //       Object.keys(compilation.assets).forEach(assetName => {
        //         if (assetName != name && assetName.startsWith(name)) {
        //           delete compilation.assets[assetName]
        //         }
        //       })
        //     }
        //   })
        // })
      })

      // `make` all `initialEntries` and add `additionalEntries` when they have been recorded
      compiler.plugin('make', (compilation, done) => {

        Promise.all(initialEntries.map(addEntry(compilation)))
          .then(compileClientEntries)
          .then(_ => { done() })
          .catch(e => { done(e) })

        function compileClientEntries() {
          const childCompiler = compilation.createChildCompiler('react-universal-plugin-client-compiler')
          childCompiler.context = compiler.context

          const options = childCompiler.options
          options.target = 'web'
          options.resolve.mainFields = ["browser", "module", "main"]

          //options.output.libraryTarget = 'var'
          childCompiler.apply.apply(childCompiler, options.plugins)

          // we changed the resolve options, so we need to update the resolver
          childCompiler.resolvers.normal = ResolverFactory.createResolver(Object.assign({
            fileSystem: childCompiler.inputFileSystem
          }, options.resolve))
          childCompiler.applyPlugins("after-resolvers", compiler)

          // copied from webpack options apply
          childCompiler.apply(
            new JsonpTemplatePlugin(options.output),
            new NodeSourcePlugin(options.node),
            new LoaderTargetPlugin(options.target)
          )
          
          childCompiler.plugin('compilation', (compilation, { normalModuleFactory }) => {

            // make sure the SingleEntryDependency has a factory
            compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory)
            
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
                  if (assetName != name && assetName.startsWith(name)) {
                    delete compilation.assets[assetName]
                  }
                })
              })
            })
          })

          childCompiler.plugin('make', (compilation, done) => {
            Promise.all(additionalEntries.map(addEntry(compilation)))
              .then(_ => { done() })
              .catch(e => { done(e) })
          })

          return new Promise((resolve, reject) => {
            childCompiler.runAsChild((err, chunks, compilation) => {
              err ? reject(err) : resolve()
            })
          })
        }
      })

      function addEntry(compilation) {
        return entry => new Promise((resolve, reject) => {
          compilation.addEntry(compiler.context, entry, entry.loc, err => err ? reject(err) : resolve())
        })
      }
    }
  }
}
