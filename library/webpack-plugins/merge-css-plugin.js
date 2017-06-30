const { ConcatSource } = require('webpack-sources')

module.exports = function mergeCssPlugin() {
  return {
    apply: compiler => {
      compiler.plugin('compilation', compilation => {
        const chunkCssAssets = []

        // extract css assets
        compilation.plugin('before-module-assets', () => {
          const assetsToRemove = []

          compilation.chunks.forEach(chunk => {
            // this should be an option
            if (chunk.name === 'public_entry') return

            const currentChunkCssAssets = []
            chunkCssAssets.push([chunk.name, currentChunkCssAssets])
            chunk.modules.forEach(({ assets = {}, request }) => {
              Object.keys(assets).filter(x => x.endsWith('.css')).forEach(x => {
                currentChunkCssAssets.push(assets[x])
                assetsToRemove.push(() => { delete assets[x] })
              })
            })
          })

          assetsToRemove.forEach(remove => remove())
        })

        // merge css assets
        compilation.plugin('additional-chunk-assets', () => {
          chunkCssAssets.forEach(([chunkName, cssAssets]) => {
            if (cssAssets.length) {
              const newChunkName = chunkName + (chunkName.endsWith('.css') ? '' : '.css')
              compilation.assets[newChunkName] = new ConcatSource(...cssAssets)
            }
          })
        })
      })
    }
  }
}
