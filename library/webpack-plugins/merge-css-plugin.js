/*
  Merges all css assets available for a given chunk, note that importing css in an entry chunk currently does not work.

  The resulting css file will be one of the following:
  - `x.entry.css` for `x.entry.css`
  - `x.css` for `x.templateType.js`
*/

const { ConcatSource, RawSource } = require('webpack-sources')

module.exports = function mergeCssPlugin() {
  return {
    apply: compiler => {
      compiler.plugin('compilation', compilation => {
        const chunkCssAssets = []

        // extract css assets
        compilation.plugin('before-module-assets', () => {

          compilation.chunks.forEach(chunk => {
            const currentChunkCssAssets = []
            chunkCssAssets.push([chunk.name, currentChunkCssAssets])
            const modules = chunk.getModules().sort(({ index: a }, { index: b }) => a - b)
            modules.forEach(({ assets = {}, request }) => {
              Object.keys(assets).filter(x => x.endsWith('.css')).forEach(x => {
                currentChunkCssAssets.push(x)
              })
            })
          })
        })

        // remove assets that will be merged
        compilation.plugin('before-chunk-assets', () => {
          const assetsToRemove = []
          chunkCssAssets.forEach(([chunkName, cssAssets]) => {
            const actualCssAssets = cssAssets.map(x => compilation.assets[x])
            assetsToRemove.push(...cssAssets)
            cssAssets.length = 0
            cssAssets.push(...actualCssAssets)
          })
          assetsToRemove.forEach(x => { delete compilation.assets[x] })
        })

        // merge css assets
        compilation.plugin('additional-chunk-assets', (chunks) => {
          chunkCssAssets.forEach(([chunkName, cssAssets]) => {
            if (cssAssets.length) {
              const templatePattern = /\.([^\./]+)\.js$/
              const [, type] = templatePattern.exec(chunkName) || []

              const newChunkName = type === 'entry' ? chunkName : chunkName.replace(templatePattern, '')

              const chunkCssName = newChunkName + (newChunkName.endsWith('.css') ? '' : '.css')
              compilation.assets[chunkCssName] = new ConcatSource(...cssAssets.map(createValidSource))
            }
          })
        })
      })
    }
  }
}

function createValidSource(source) {
  // https://github.com/webpack/webpack-sources/issues/26
  return source instanceof RawSource
    ? new RawSource(source.source().toString())
    : source
}
