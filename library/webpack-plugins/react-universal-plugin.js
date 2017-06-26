const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency')
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
module.exports = function reactUniversalPlugin() {

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

          } else if (query === '?universal-client') {
            loaders.push({ loader: require.resolve('../webpack-loaders/react-universal-client-loader') })
          }
          done(null, data)
        })

        // mark client entry modules and provide `universal` variables
        compilation.plugin('normal-module-loader', (context, module) => {
          module.universalClient = module.userRequest.endsWith('?universal-client')
        })

        // remove redundant assets from client chunk 
        compilation.plugin('optimize-chunks', chunks => {
          chunks.forEach((chunk) => {
            const { entryModule, modules, name } = chunk
            if (entryModule.universalClient) {
              modules.forEach(({ assets }) => {
                for (const name in assets) {
                  if (!(/\.js(\.map)?$/).test(name)) delete assets[name]
                }
              })
            }
          })
        })
      })

      // `make` all `initialEntries` and add `additionalEntries` when they have been recorded
      compiler.plugin('make', (compilation, done) => {
        Promise.all(initialEntries.map(addEntry))
          .then(_ => Promise.all(additionalEntries.map(addEntry)))
          .then(_ => { done() })
          .catch(e => { done(e) })

        function addEntry(entry) {
          return new Promise((resolve, reject) => {
            compilation.addEntry(compiler.context, entry, entry.loc, err => err ? reject(err) : resolve())
          })
        }
      })
    }
  }
}