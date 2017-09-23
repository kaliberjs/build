/*
  Merges all css assets available for a given chunk, note that importing css in an entry chunk currently does not work.

  The resulting css file will be one of the following:
  - `x.entry.css` for `x.entry.css`
  - `x.css` for `x.templateType.js`
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
        const chunkCssAssets = {}

        // extract css assets
        // note to self, is it really nescessary to do this in before-module-assets? It could probably be done in 
        // before-chunk-assets
        compilation.plugin('before-module-assets', () => {
          compilation.chunks.forEach(chunk => {
            const currentChunkCssAssets = []
            const modules = chunk.getModules().sort(({ index: a }, { index: b }) => a - b)
            modules.forEach(({ assets = {} }) => {
              Object.keys(assets).filter(x => x.endsWith('.css')).forEach(asset => {
                currentChunkCssAssets.push(asset)
              })
            })
            chunkCssAssets[chunk.name] = currentChunkCssAssets
          })
        })

        // remove assets that will be merged
        compilation.plugin('before-chunk-assets', () => {
          const assetsToRemove = []
          Object.keys(chunkCssAssets).forEach(chunkName => {
            const cssAssets = chunkCssAssets[chunkName]
            const hash = crypto.createHash('md5')
            const actualCssAssets = cssAssets.map(x => {
              const asset = compilation.assets[x]
              asset.updateHash(hash)
              return asset
            })
            assetsToRemove.push(...cssAssets)
            cssAssets.length = 0
            cssAssets.push(...actualCssAssets)

            const cssHash = hash.digest('hex')
            compilation.applyPlugins('chunk-css-hash', chunkName, cssHash)
            chunkCssAssets[chunkName] = { cssHash, cssAssets }
          })
          assetsToRemove.forEach(x => { delete compilation.assets[x] })
        })

        // make sure the __webpack_css_chunk_hash__ is available in modules (code copied from ExtendedApiPlugin)
        compilation.dependencyFactories.set(ConstDependency, new NullFactory())
        compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())
        compilation.mainTemplate.plugin('require-extensions', function(source, chunk, hash) {
          const cssHash = (x => x && x.cssHash || 'no_css_files_in_chunk')(chunkCssAssets[chunk.name])
          const buf = [
            source,
            '',
            '// __webpack_css_chunk_hash__',
            `${this.requireFn}.cch = ${JSON.stringify(cssHash)};`
          ]
          return this.asString(buf)
        })
        compilation.mainTemplate.plugin('global-hash', () => true)
        normalModuleFactory.plugin('parser', (parser, parserOptions) => {
          parser.plugin(`expression __webpack_css_chunk_hash__`, ParserHelpers.toConstantDependency('__webpack_require__.cch'))
          parser.plugin(`evaluate typeof __webpack_css_chunk_hash__`, ParserHelpers.evaluateToString('string'))
        })

        // merge css assets
        compilation.plugin('additional-chunk-assets', (chunks) => {

          const chunksByName = chunks.reduce(
            (result, chunk) => (result[chunk.name] = chunk, result),
            {}
          )

          Object.keys(chunkCssAssets).forEach(chunkName => {
            const { cssAssets, cssHash } = chunkCssAssets[chunkName]
            if (cssAssets.length) {
              const templatePattern = /\.([^\./]+)\.css$/
              const [, type] = templatePattern.exec(chunkName) || []

              const newChunkName = type === 'entry' ? chunkName : cssHash

              const chunkCssName = newChunkName + (newChunkName.endsWith('.css') ? '' : '.css')
              if (chunkName != chunkCssName) (x => x && x.files.push(chunkCssName))(chunksByName[chunkName])
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
