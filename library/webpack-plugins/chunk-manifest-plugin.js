/*
  This plugin listens for the `chunk-asset` hook and records the following information:

  {
    'chunkName': {
      filename: 'public/path/to/chunk',
      hasRuntime: true/false,
      group: ['chunkName1', ..., 'chunkNameN'],
      isShared: true/false,
    }
  }

  It supplies a `chunk-manifest` hook that can be used by other plugins to obtain this information.

  On top of that it generates a `chunk-manifest.json` file that can be used to render the correct
  scripts on a page.
*/

const { RawSource } = require('webpack-sources')
const { SyncHook } = require('tapable')

const p = 'chunk-manifest-plugin'

module.exports = function chunkManifestPlugin({ filename }) {
  return {
    apply: compiler => {

      compiler.hooks.compilation.tap(p, compilation => {
        if (compilation.hooks.chunkManifest) throw new Error('Hook `chunkManifest` already in use')
        compilation.hooks.chunkManifest = new SyncHook(['chunkAssets'])

        const chunkAssets = {}
        compilation.hooks.chunkAsset.tap(p, (chunk, filename, _) => {

          /* remove if https://github.com/webpack/webpack/issues/7828 is resolved */ if (chunk === 'HotModuleReplacementPlugin') return
          if (filename.includes('hot-update')) return

          const groups = [...chunk.groupsIterable]
          const isShared = groups.length > 1
          const [group] = groups

          chunkAssets[chunk.name || `unnamed-${chunk.id}`] = Object.assign({
            filename,
            hasRuntime: chunk.hasRuntime(),
            isShared,
            group: isShared ? [] : group.chunks.filter(x => x !== chunk).map(x => x.name || `unnamed-${x.id}`)
          })
        })

        compilation.hooks.additionalChunkAssets.tap(p, chunks => {
          const chunkManifest = sortGroups(chunkAssets)
          compilation.hooks.chunkManifest.call(chunkManifest)
          compilation.assets[filename] = new RawSource(JSON.stringify(chunkManifest, null, 2))

          function sortGroups(chunkAssets) {
            return Object.keys(chunkAssets).reduce(
              (result, key) => {
                const group = []

                chunkAssets[key].group.forEach(x => {
                  if (chunkAssets[x].hasRuntime) group.unshift(x)
                  else group.push(x)
                })

                return Object.assign(result, {
                  [key]: Object.assign({}, chunkAssets[key], { group })
                })
              },
              {}
            )
          }
        })
      })
    }
  }
}
