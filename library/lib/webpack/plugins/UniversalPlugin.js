const path = require('path')
const { createScopedWeakMap } = require('../utils/weakMap')
const { dynamicEntries } = require('../utils/dynamicEntries')
const { createChildCompiler } = require('../utils/childCompiler')

const p = 'kaliber.UniversalPlugin'

const universalLoader = {
  loader: require.resolve('../loaders/universal-server-loader'),
  ident: 'UniversalPlugin?universal',
  options: {},
  type: null,
}

const containerlessUniversalLoader = {
  loader: require.resolve('../loaders/containerless-universal-server-loader'),
  ident: 'UniversalPlugin.universal',
  options: {},
  type: null,
}

module.exports = { UniversalPlugin }

function UniversalPlugin({ browserConfig }) {
  return {
    /** @param {import('webpack').Compiler} compiler */
    apply(compiler) {

      // will be filled by when server entries are being processed
      const getClientEntries = createScopedWeakMap({ createInitialValueForScope: () => ({}) })

      compiler.hooks.thisCompilation.tap(p, (compilation, { normalModuleFactory }) => {
        const clientEntries = getClientEntries(compilation)

        /**
         * Collect universal candidates. For each universal import add an additional loader and
         * record it as a client entry.
         */
        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          if (!data.createData.loaders) data.createData.loaders = []
          const { loaders, resourceResolveData = {} } = data.createData

          if (resourceResolveData.query === '?universal') {
            loaders.push(universalLoader)

            const name = path.relative(compiler.context, resourceResolveData.path)
            clientEntries[name] = { import: ['./' + name + '?universal-client'] }
          }

          if (
            resourceResolveData.path.endsWith('.universal.js') &&
            resourceResolveData.query !== '?original'
          ) {
            loaders.push(containerlessUniversalLoader)

            const name = path.relative(compiler.context, resourceResolveData.path)
            clientEntries[name] = { import: ['./' + name + '?containerless-universal-client'] }
          }
        })
      })

      let makesToWaitFor = []
      compiler.hooks.make.intercept({
        register(tap) {
          if (tap.name === p) return tap
          if (tap.type !== 'promise') throw new Error(`No code written to deal with tap of type '${tap.type}'`)

          let resolvePromise = null
          makesToWaitFor.push(new Promise(resolve => { resolvePromise = resolve }))
          return {
            ...tap,
            fn: async compilation => {
              await tap.fn(compilation)
              resolvePromise()
            }
          }
        },
      })

      compiler.hooks.make.tapPromise(p, async compilation => {
        const clientCompiler = createChildCompiler({
          configuration: browserConfig,
          compiler,
          compilation
        })
        dynamicEntries(
          async () => {
            await Promise.all(makesToWaitFor)
            const clientEntries = getClientEntries(compilation)

            console.log({ clientEntries })
            return clientEntries
          },
          { compiler: clientCompiler }
        )

        const entries = await new Promise((resolve, reject) => {
          clientCompiler.runAsChild((e, entries, compilation) => {
            if (e) reject(e)
            else resolve(entries)
          })
        })

        // console.log(entries.map(x => ({ name: x.name, id: x.id, files: x.files })))
      })
    }
  }
}

