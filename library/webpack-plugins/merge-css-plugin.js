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
const { Compilation } = require('webpack')

const p = 'merge-css-plugin'

const getHooks = createGetHooks(() => ({
  chunkCssHashes: new SyncHook(['chunkName', 'cssHashes'])
}))
mergeCssPlugin.getHooks = getHooks

module.exports = mergeCssPlugin
function mergeCssPlugin() {
  return {
    /** @param {import('webpack').Compiler} compiler */
    apply: compiler => {
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {

        const newChunksWithCssAssets = {}
        const chunkCssHashes = new Map()

        // extract css assets
        compilation.hooks.beforeRuntimeRequirements.tap(p, () => {
          const cssAssetChunks = {}

          // determine all css assets and record the chunks they're used in
          compilation.chunks.forEach(chunk => {
            const modules = compilation.chunkGraph.getChunkModules(chunk)
              .map(module => ({ module, index: compilation.moduleGraph.getPreOrderIndex(module) }))
              .sort(({ index: a }, { index: b }) => a - b)

            modules.forEach(({ module: { buildInfo: { assets = {} } } }) => {
              Object.entries(assets)
                .filter(([assetName]) => assetName.endsWith('.css'))
                .forEach(([assetName, asset]) => {
                  const assetChunks = cssAssetChunks[assetName]
                  if (assetChunks) assetChunks.chunks.push(chunk)
                  else cssAssetChunks[assetName] = { asset, chunks: [chunk] }
                })
            })
          })

          // group the css assets that are used in the same chunks
          Object.keys(cssAssetChunks).forEach(assetName => {
            const { chunks, asset } = cssAssetChunks[assetName]
            const name = chunks.map(x => x.name).join(', ')

            const { assets } = newChunksWithCssAssets[name] || {}
            if (assets) assets.push({ assetName, asset })
            else newChunksWithCssAssets[name] = { chunks, assets: [{ assetName, asset }] }
          })

          // add hashes for the assets
          Object.keys(newChunksWithCssAssets).forEach(chunkName => {
            const newChunk = newChunksWithCssAssets[chunkName]
            const { assets } = newChunk
            const hash = crypto.createHash('md5')
            assets.forEach(({ asset }) => {
              asset.updateHash(hash)
            })
            newChunk.hash = hash.digest('hex')
          })

          compilation.chunks.forEach(chunk => {
            const cssHashes = Object.keys(newChunksWithCssAssets)
              .map(name => newChunksWithCssAssets[name])
              .filter(({ chunks }) => chunks.includes(chunk))
              .sort(({ chunks: a }, { chunks: b }) => b.length - a.length)
              .map(({ hash }) => hash)
            chunkCssHashes.set(chunk, cssHashes)
            mergeCssPlugin.getHooks(compilation).chunkCssHashes.call(chunk.name, cssHashes)
          })
        })

        /* TODO: comments kloppen niet meer
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
            const { assets } = newChunk
            const assetNames = assets.map(x => x.assetName)
            assetsToRemove.push(...assetNames)
          })

          assetsToRemove.forEach(x => { delete compilation.assets[x] })
        })

        // make sure the __webpack_css_chunk_hashes__ is available in modules
        addBuiltInVariable({
          compilation, normalModuleFactory,
          pluginName: p,
          variableName: '__webpack_css_chunk_hashes__',
          abbreviation: 'cch',
          type: 'array',
          createValue: (chunk) => chunkCssHashes.get(chunk) || []
        })

        // merge css assets
        compilation.hooks.processAssets.tap(
          { name: p, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
          assets => {
            const { chunks } = compilation
            // remove any css entry chunk assets
            chunks.forEach(({ name }) => {
              if (name && name.endsWith('.css')) delete compilation.assets[name]
            })

            // create a manifest
            const manifest = Array.from(chunks).reduce(
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
              const { chunks, assets, hash } = newChunksWithCssAssets[chunkName]

              const chunkCssName = hash + '.css'

              chunks.forEach(chunk => { chunk.files.add(chunkCssName) })

              compilation.assets[chunkCssName] = new ConcatSource(...assets.map(x => createValidSource(x.asset)))
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
