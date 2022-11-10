/*
  Merges all css assets available for a given chunk, note that importing css in an entry chunk currently does not work.

  It will create a css file with a hash (based on the css content) as it's filename.

  This plugin makes the __webpack_css_chunk_hash__ variable available to get the hash of the css that is linked
  from the current chunk.

  It also adds a 'chunkCssHashes' hook which can be used by plugins to record the css hash of a chunk:

  mergeCssPlugin.getHooks(compilation).chunkCssHashes.tap('plugin-name', (chunkName, cssHashes) => {
    ...
  })
*/

const crypto = require('crypto')
const { ConcatSource, RawSource } = require('webpack-sources')
const { SyncHook } = require('tapable')
const { addBuiltInVariable, createGetHooks } = require('../lib/webpack-utils')

const p = 'merge-css-plugin'

const getHooks = createGetHooks(() => ({
  chunkCssHashes: new SyncHook(['chunkName', 'cssHashes'])
}))
mergeCssPlugin.getHooks = getHooks

module.exports = mergeCssPlugin
function mergeCssPlugin() {
  return {
    apply: compiler => {
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {

        const newChunksWithCssAssets = {}
        const chunkCssHashes = new Map()

        // extract css assets
        compilation.hooks.beforeModuleAssets.tap(p, () => {
          const cssAssetChunks = {}

          // determine all css assets and record the chunks they're used in
          compilation.chunks.forEach(chunk => {
            const modules = chunk.getModules().sort(({ index: a }, { index: b }) => a - b)
            modules.forEach(({ buildInfo: { assets = {} } }) => {
              Object.keys(assets).filter(x => x.endsWith('.css')).forEach(assetName => {
                const chunks = cssAssetChunks[assetName]
                if (chunks) chunks.push(chunk)
                else cssAssetChunks[assetName] = [chunk]
              })
            })
          })

          // group the css assets that are used in the same chunks
          Object.keys(cssAssetChunks).forEach(assetName => {
            const chunks = cssAssetChunks[assetName]
            const name = chunks.map(x => x.name).join(', ')

            const { assetNames } = newChunksWithCssAssets[name] || {}
            if (assetNames) assetNames.push(assetName)
            else newChunksWithCssAssets[name] = { chunks, assetNames: [assetName] }
          })
        })

        /*
          {
            ['chunk1.name, ..., chunkN.name']: {
              chunks: [chunk1, ..., chunkN],
              assetNames: [asset1, ..., assetN]
            }
          }
        */
        // remove assets that will be merged and add a hash and the actual assets
        // to the new chunks
        compilation.hooks.beforeChunkAssets.tap(p, () => {
          const assetsToRemove = []

          Object.keys(newChunksWithCssAssets).forEach(chunkName => {
            const newChunk = newChunksWithCssAssets[chunkName]
            const { assetNames } = newChunk
            const hash = crypto.createHash('md5')
            const assets = assetNames.map(x => {
              const asset = compilation.assets[x]
              asset.updateHash(hash)
              return asset
            })
            assetsToRemove.push(...assetNames)

            const cssHash = hash.digest('hex')

            newChunk.cssHash = cssHash
            newChunk.assets = assets
          })

          assetsToRemove.forEach(x => { delete compilation.assets[x] })

          compilation.chunks.forEach(chunk => {
            const cssHashes = Object.keys(newChunksWithCssAssets)
              .map(name => newChunksWithCssAssets[name])
              .filter(({ chunks }) => chunks.includes(chunk))
              .sort(({ chunks: a }, { chunks: b }) => b.length - a.length)
              .map(({ cssHash }) => cssHash)

            chunkCssHashes.set(chunk, cssHashes)
            mergeCssPlugin.getHooks(compilation).chunkCssHashes.call(chunk.name, cssHashes)
          })
        })

        // make sure the __webpack_css_chunk_hashes__ is available in modules
        addBuiltInVariable({
          compilation, normalModuleFactory,
          pluginName: p,
          variableName: '__webpack_css_chunk_hashes__',
          abbreviation: 'cch',
          type: 'array',
          createValue: (source, chunk, hash) => chunkCssHashes.get(chunk) || []
        })

        // merge css assets
        compilation.hooks.additionalChunkAssets.tap(p, chunks => {

          // remove any css entry chunk assets
          chunks.forEach(({ name }) => {
            if (name && name.endsWith('.css')) delete compilation.assets[name]
          })

          // create a manifest
          const manifest = chunks.reduce(
            (result, chunk) => {
              const cssHashes = chunkCssHashes.get(chunk) || []
              if (!cssHashes.length) return result
              result[chunk.name] = cssHashes.map(hash => hash + '.css')
              return result
            },
            {}
          )
          compilation.assets['css-manifest.json'] = new RawSource(JSON.stringify(manifest, null, 2))

          // create css assets
          Object.keys(newChunksWithCssAssets).forEach(chunkName => {
            const { chunks, assets, cssHash } = newChunksWithCssAssets[chunkName]

            const chunkCssName = cssHash + '.css'

            chunks.forEach(chunk => { chunk.files.push(chunkCssName) })

            compilation.assets[chunkCssName] = new ConcatSource(...assets.map(createValidSource))
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
