/*
  This plugin determines when @kaliber/config is imported and pushes the custom config-loader
*/
const p = 'config-loader-plugin'

module.exports = function configLoaderPlugin() {
  return {
    apply: compiler => {
      compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {

        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          const { loaders, rawRequest } = data

          if (rawRequest === '@kaliber/config')
            loaders.push({ loader: require.resolve('../webpack-loaders/config-loader') })

          return data
        })
      })
    }
  }
}
