/*
  This plugin determines when @kaliber/config is imported and pushes the custom config-loader
*/
const p = 'config-loader-plugin'

module.exports = function configLoaderPlugin() {
  return {
    /** @param {import('webpack').Compiler} compiler */
    apply: compiler => {
      compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {

        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          const { loaders, rawRequest } = data.createData
          if (rawRequest === '@kaliber/config')
            loaders.push({
              loader: require.resolve('../webpack-loaders/config-loader'),
              type: undefined,
              ident: 'added by config-loader-plugin because of @kaliber/config',
              options: {},
            })
        })
      })
    }
  }
}
