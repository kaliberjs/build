/*
  Tells webpack to keep source maps around and generates one for every chunk that
  has a source map available.
*/

const path = require('path')
const { RawSource, ConcatSource } = require('webpack-sources')

const p = 'kaliber.SourceMapPlugin'

module.exports = { SourceMapPlugin }

function SourceMapPlugin({ sourceRoot }) {
  return {
    /** @param {import('webpack').Compiler} compiler */
    apply(compiler) {
      compiler.hooks.thisCompilation.tap(p, compilation => {

        // make sure webpack stuff keeps their source maps
        compilation.hooks.buildModule.tap(p, module => {
          module.useSourceMap = true
        })

        // add source map assets for anything that still has one
        compilation.hooks.afterOptimizeAssets.tap(p, assets => {
          Object.keys(assets).forEach(name => {
            const asset = assets[name]
            const map = asset.map()

            if (map) {
              const [startComment, endComment] = name.endsWith('.css') ? ['/*', ' */'] : ['//', '']

              compilation.updateAsset(
                name,
                asset => new ConcatSource(
                  asset,
                  `\n${startComment}# sourceMappingURL=${path.basename(name)}.map${endComment}\n`
                )
              )

              compilation.emitAsset(
                `${name}.map`,
                new RawSource(JSON.stringify(adjustSourceMap({ map, sourceRoot })))
              )
            }
          })
        })
      })
    }
  }
}

function adjustSourceMap({ map, sourceRoot }) {
  // make sure sources in the source map are timestamped, this helps with hot reloading
  const now = Date.now()
  map.sources = map.sources.map(source =>
    path.relative(sourceRoot, source) + (source.includes('?') ? '&' : '?') + now
  )

  return { ...map, sourceRoot: `${sourceRoot}/` }
}
