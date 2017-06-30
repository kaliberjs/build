const { ConcatSource } = require('webpack-sources')

module.exports = function mergeCssPlugin() {
  return {
    apply: compiler => {
      compiler.plugin('compilation', compilation => {
        const chunkCssAssets = []

        // extract css assets
        compilation.plugin('before-module-assets', () => {

          console.log('before module assets')

          compilation.chunks.forEach(chunk => {
            // this should be an option
            if (chunk.name === 'public_entry') return

            const currentChunkCssAssets = []
            chunkCssAssets.push([chunk.name, currentChunkCssAssets])
            chunk.modules.forEach(({ assets = {}, request }) => {
              Object.keys(assets).filter(x => x.endsWith('.css')).forEach(x => {
                currentChunkCssAssets.push(x)
              })
            })
          })
        })

        // merge css assets
        compilation.plugin('before-chunk-assets', () => {

          const assetsToRemove = []

          chunkCssAssets.forEach(([chunkName, cssAssets]) => {
            if (cssAssets.length) {
              const newChunkName = chunkName + (chunkName.endsWith('.css') ? '' : '.css')
              compilation.assets[newChunkName] = new ConcatSource(...cssAssets.map(x => compilation.assets[x]))
              assetsToRemove.push(...cssAssets)
            }
          })

          assetsToRemove.forEach(x => { delete compilation.assets[x] })
        })
      })
    }
  }
}
