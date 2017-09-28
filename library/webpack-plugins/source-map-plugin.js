/*
  Tells webpack to keep source maps around and generates one for every chunk that
  has a source map available.
*/

const { RawSource, ConcatSource } = require('webpack-sources')
const path = require('path')

module.exports = function sourceMapPlugin () {
  return {
    apply: compiler => {
      compiler.plugin('compilation', compilation => {

        // make sure webpack stuff keeps their source maps
        compilation.plugin('build-module', module => {
          module.useSourceMap = true
        })

        // add source map assets for anything that still has one
        compilation.plugin('after-optimize-assets', assets => {
          Object.keys(assets).forEach(name => {
            const asset = assets[name]
            const map = asset.map()
            if (map) {

              // make sure sources in the source map are timestamped, this helps with hot reloading
              const now = Date.now()
              map.sources = map.sources.map(source => source + (source.includes('?') ? '&' : '?') + now)

              const [startComment, endComment] = name.endsWith('.css') ? ['/*', ' */'] : ['//', '']
              assets[name] = new ConcatSource(asset, `\n${startComment}# sourceMappingURL=${path.basename(name)}.map${endComment}\n`)
              assets[name + '.map'] = new RawSource(JSON.stringify(map))
            }
          })
        })
      })
    }
  }
}
