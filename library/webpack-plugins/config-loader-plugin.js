module.exports = function configLoaderPlugin() {

  return {
    apply: compiler => {
      compiler.plugin('normal-module-factory', normalModuleFactory => {

        normalModuleFactory.plugin('after-resolve', (data, done) => {
          const { loaders, rawRequest } = data
          
          if (data.rawRequest === '@kaliber/config')
            loaders.push({ loader: require.resolve('../webpack-loaders/config-loader') })

          done(null, data)
        })
      })

    }
  }
}
