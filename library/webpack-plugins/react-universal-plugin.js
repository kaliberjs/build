const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const { universalClientMarker } = require('../webpack-loaders/react-universal-support')

module.exports = function reactUniversalPlugin() {

  return {
    apply: compiler => {
      compiler.plugin('compilation', compilation => {
        
        // mark client entry modules and provide `addEntry` function to loaders
        compilation.plugin('normal-module-loader', (context, module) => {
          module.universalClient = module.userRequest.endsWith(universalClientMarker)
          // we should probably be more selective
          context.addEntry = (resource, name, callback) => {
            const dep = SingleEntryPlugin.createDependency(resource, name)
            compilation.addEntry(context.options.context, dep, name, callback)
          }
        })

        // remove redundant assets from client chunk 
        compilation.plugin('optimize-chunks', chunks => {
          chunks.forEach(({ entryModule, modules, name }) => {
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
    }
  }
}