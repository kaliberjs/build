/*
  Merges all css assets available for a given chunk, note that importing css in an entry chunk currently does not work.

  It will create a css file with a hash (based on the css content) as it's filename.

  This plugin makes the __webpack_css_chunk_hash__ variable available to get the hash of the css that is linked
  from the current chunk.

  It also adds a 'chunk-css-hashes' hook which can be used by plugins to record the css hash of a chunk:

  compilation.plugin('chunk-css-hashes', (chunkName, cssHash) => {
    ...
  })
*/

const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')
const ParserHelpers = require('webpack/lib/ParserHelpers')
const crypto = require('crypto')
const { ConcatSource, RawSource } = require('webpack-sources')

module.exports = function mergeCssPlugin() {
  return {
    apply: compiler => {
      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {

        const newChunksWithCssAssets = {}
        const chunkCssHashes = new Map()

        // extract css assets
        compilation.plugin('before-module-assets', () => {
          const cssAssetChunks = {}

          // determine all css assets and record the chunks they're used in
          compilation.chunks.forEach(chunk => {
            const modules = chunk.getModules().sort(({ index: a }, { index: b }) => a - b)
            modules.forEach(({ assets = {} }) => {
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
        compilation.plugin('before-chunk-assets', () => {
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
            compilation.applyPlugins('chunk-css-hashes', chunk.name, cssHashes)
          })
        })

        // make sure the __webpack_css_chunk_hashes__ is available in modules (code copied from ExtendedApiPlugin)
        compilation.dependencyFactories.set(ConstDependency, new NullFactory())
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())
        compilation.mainTemplate.plugin('require-extensions', function(source, chunk, hash) {

          const cssHashes = chunkCssHashes.get(chunk) || []

          const buf = [
            source,
            '',
            '// __webpack_css_chunk_hashes__',
            `${this.requireFn}.cch = ${JSON.stringify(cssHashes)};`
          ]
          return this.asString(buf)
        })
        compilation.mainTemplate.plugin('global-hash', () => true)
        normalModuleFactory.plugin('parser', (parser, parserOptions) => {
          parser.plugin(`expression __webpack_css_chunk_hashes__`, ParserHelpers.toConstantDependency('__webpack_require__.cch'))
          parser.plugin(`evaluate typeof __webpack_css_chunk_hashes__`, ParserHelpers.evaluateToString('string'))
        })

        // merge css assets
        compilation.plugin('additional-chunk-assets', chunks => {

          // remove any css entry chunk assets
          chunks.forEach(({ name }) => {
            if (name.endsWith('.css')) delete compilation.assets[name]
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
