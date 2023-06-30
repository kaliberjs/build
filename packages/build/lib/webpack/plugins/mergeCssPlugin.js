import crypto from 'node:crypto'
import webpack from 'webpack'

const p = 'merge-css-plugin'

/**
 * @typedef {Array<{
 *   chunks: Array<webpack.Chunk>,
 *   assets: Array<{ assetName: string, asset: webpack.sources.Source }>,
 *   hash: string,
 * }>} GroupedCssAssets
 */
export function mergeCssPlugin() {
  return {
    /** @param {webpack.Compiler} compiler */
    apply: compiler => {
      compiler.hooks.thisCompilation.tap(p, compilation => {

        /** @type {GroupedCssAssets} */
        const groupedCssAssets = []

        collectAndGroupCssAssets({ compilation, basket: groupedCssAssets })

        removeAssetsThatWillBeMerged({ compilation, groupedCssAssets })

        mergeAndEmitAssets({ compilation, groupedCssAssets })
      })
    }
  }
}

/** @param {{ compilation: webpack.Compilation, basket: GroupedCssAssets }} props */
function collectAndGroupCssAssets({ compilation, basket }) {
  compilation.hooks.beforeRuntimeRequirements.tap(p, () => {
    const cssAssetInfo = extractCssAssetInfo({ compilation })
    const groupedCssAssets = groupSharedCssAssets({ cssAssetInfo })
    const groupedCssAssetsWithHash = addHashToGroupedCssAssets({ groupedCssAssets })

    groupedCssAssetsWithHash.forEach(x => basket.push(x))
  })
}

/** @param {{ compilation: webpack.Compilation, groupedCssAssets: GroupedCssAssets }} props */
function removeAssetsThatWillBeMerged({ compilation, groupedCssAssets }) {
  compilation.hooks.beforeChunkAssets.tap(p, () => {
    const assetsToRemove = groupedCssAssets.flatMap(x => {
      return x.assets.map(x => x.assetName)
    })

    assetsToRemove.forEach(x => { delete compilation.assets[x] })
  })
}

/** @param {{ compilation: webpack.Compilation, groupedCssAssets: GroupedCssAssets }} props */
function mergeAndEmitAssets({ compilation, groupedCssAssets }) {
  compilation.hooks.processAssets.tap(
    { name: p, stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
    assets => {
      groupedCssAssets.forEach(x => {
        const newCssChunkName = 'public/' + x.hash + '.css'

        x.chunks.forEach(chunk => { chunk.files.add(newCssChunkName) })
        assets[newCssChunkName] = new webpack.sources.ConcatSource(...x.assets.map(x => x.asset))
      })
    }
  )
}

/**
 * @param {{ compilation: webpack.Compilation }} props
 */
function extractCssAssetInfo({ compilation }) {
  const chunksByAssetName = Array.from(compilation.chunks).reduce(
    (result, chunk) => {
      const cssAssets = extractCssAssetsFromChunk({ compilation, chunk })

      return cssAssets.reduce(
        (result, { name, asset }) => {
          const assetInfo = result[name]
          if (assetInfo) assetInfo.chunks.push(chunk)
          else result[name] = { asset, chunks: [chunk] }
          return result
        },
        result
      )
    },
    /** @type {{ [assetName: string]: { asset:any, chunks: Array<webpack.Chunk> } }} */ ({})
  )

  return Object.entries(chunksByAssetName).map(([assetName, info]) => ({ assetName, ...info }))
}


/** @param {{ compilation: webpack.Compilation, chunk: webpack.Chunk }} props */
function extractCssAssetsFromChunk({ compilation, chunk }) {
  const modules = getSortedModules({ compilation, chunk })

  return modules.flatMap(module => {
    const { assets = {} } = module.buildInfo
    return extractCssAssets(assets)
  })
}

/** @param {{ compilation: webpack.Compilation, chunk: webpack.Chunk }} props */
function getSortedModules({ compilation, chunk }) {
  return compilation.chunkGraph.getChunkModules(chunk)
      .map(module => ({ module, index: compilation.moduleGraph.getPreOrderIndex(module) }))
      .sort(({ index: a }, { index: b }) => a - b)
      .map(x => x.module)
}

function extractCssAssets(assets) {
  return Object.entries(assets)
    .filter(([assetName]) => assetName.endsWith('.css'))
    .map(([name, asset]) => ({ name, asset }))
}

/**
 * @param {{
 *   cssAssetInfo: Array<{ asset: any, chunks: Array<webpack.Chunk>, assetName: string }>
 * }} props
 */
function groupSharedCssAssets({ cssAssetInfo }) {
 const groupedCssAssets = cssAssetInfo.reduce(
   (result, { assetName, asset, chunks }) => {
     const combinedName = chunks.map(x => x.name).join(', ')

     const group = result[combinedName]
     if (group) group.assets.push({ assetName, asset })
     else result[combinedName] = { chunks, assets: [{ assetName, asset }]}

     return result
   },
   /**
    * @type {{
    *   [combinedName: string]: {
    *     chunks: Array<webpack.Chunk>,
    *     assets: Array<{ assetName: string, asset: any }>
    *   }
    * }}
    */ ({})
 )

 return Object.values(groupedCssAssets)
}

/**
 * @template {{ asset: webpack.sources.Source }} A
 * @template {{ assets: Array<A> }} B
 * @param {{ groupedCssAssets: Array<B> }} props
 */
function addHashToGroupedCssAssets({ groupedCssAssets }) {
  return groupedCssAssets.map(info => {
    const hash = crypto.createHash('sha1')
    info.assets.forEach(({ asset }) => {
      asset.updateHash(hash)
    })
    return { ...info, hash: hash.digest('hex') }
  })
}
