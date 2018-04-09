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
const { SyncHook } = require('tapable')

const p = 'chunk-manifest-plugin'

module.exports = function chunkManifestPlugin() {
  return {
    apply: compiler => {

      compiler.hooks.compilation.tap(p, compilation => {
        if (compilation.hooks.chunkManifest) throw new Error('Hook `chunkManifest` already in use')
        compilation.hooks.chunkManifest = new SyncHook(['chunkAssets'])

        const chunkAssets = {}
        compilation.hooks.chunkAsset.tap(p, (chunk, filename) => {
          if (!chunk.name || filename.includes('hot-update')) return

          const groups = [...chunk.groupsIterable]
          const isShared = groups.length > 1
          const [group] = groups

          chunkAssets[chunk.name] = {
            filename,
            hasRuntime: chunk.hasRuntime(),
            isShared,
            ...(!isShared && { dependencies: group.chunks.filter(x => x !== chunk).map(x => x.name) })
          }
        })

        compilation.hooks.additionalChunkAssets.tap(p, chunks => {
          compilation.hooks.chunkManifest.call(chunkAssets)
          compilation.assets['chunk-manifest.json'] = new RawSource(JSON.stringify(chunkAssets, null, 2))
        })
      })
    }
  }
}
