/*
  This plugin listens for the `chunk-asset` hook and records the following information:

  {
    'chunkName': {
      filename: 'public/path/to/chunk',
      hasRuntime: true/false,
      parents: ['chunkName1', ..., 'chunkNameN']
    }
  }

  It supplies a `chunk-manifest` hook that can be used by other plugins to obtain this information.

  On top of that it generates a `chunk-manifest.json` file that can be used to render the correct
  scripts on a page.
*/

const { RawSource } = require('webpack-sources')

module.exports = function chunkManifestPlugin() {
  return {
    apply: compiler => {
      compiler.plugin('compilation', compilation => {

        const chunkAssets = {}

        compilation.plugin('chunk-asset', (chunk, filename) => {
          if (!chunk.name || filename.includes('hot-update')) return
          chunkAssets[chunk.name] = {
            filename,
            hasRuntime: chunk.hasRuntime(),
            parents: chunk.parents.map(c => c.name).filter(Boolean)
          }
        })

        compilation.plugin('additional-chunk-assets', chunks => {
          compilation.applyPlugins('chunk-manifest', chunkAssets)
          compilation.assets['chunk-manifest.json'] = new RawSource(JSON.stringify(chunkAssets, null, '  '))
        })
      })
    }
  }
}