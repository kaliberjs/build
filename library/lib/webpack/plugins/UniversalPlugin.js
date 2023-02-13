const path = require('path')

const p = 'kaliber.UniversalPlugin'

module.exports = { UniversalPlugin }

function UniversalPlugin() {
  return {
    /** @param {import('webpack').Compiler} compiler */
    apply(compiler) {
      compiler.hooks.thisCompilation.tap(p, (compilation, { contextModuleFactory, normalModuleFactory }) => {

        const clientEntries = new Map()

        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          const { loaders, resourceResolveData } = data.createData
          console.log(loaders)
          if (resourceResolveData.query === '?universal') {
            loaders.push({
              loader: require.resolve('../loaders/universal-server-loader'),
              ident: 'UniversalPlugin?universal',
              options: {},
              type: null,
            })

            const name = path.relative(compiler.context, resourceResolveData.path)
            clientEntries.set(name, './' + name + '?universal-client')
          }

          if (
            resourceResolveData.path.endsWith('.universal.js') &&
            resourceResolveData.query !== '?original'
          ) {
            loaders.push({
              loader: require.resolve('../loaders/containerless-universal-server-loader'),
              ident: 'UniversalPlugin.universal',
              options: {},
              type: null,
            })

            const name = path.relative(compiler.context, resourceResolveData.path)
            clientEntries.set(name, './' + name + '?containerless-universal-client')
          }
        })
      })
    }
  }
}
