import webpack from 'webpack'
import path from 'node:path'
import webpackSources from 'webpack-sources'

const p = 'kaliber.sourceMapPlugin'

export function sourceMapPlugin() {

  /** @param {import('webpack').Compiler} compiler */
  return compiler => {
    compiler.hooks.thisCompilation.tap(p, compilation => {
      keepSourceMapInformation({ compilation })
      addSourceMaps({ compilation })
    })
  }
}

/** @param {{ compilation: webpack.Compilation }} args */
function keepSourceMapInformation({ compilation }) {
  // Taken from webpack.SourceMapDevToolModuleOptionsPlugin
  compilation.hooks.buildModule.tap(p, module => {
    module.useSourceMap = true
  })
  compilation.hooks.runtimeModule.tap(p, module => {
    module.useSourceMap = true // we might not want this in production
  })

  webpack.javascript.JavascriptModulesPlugin.getCompilationHooks(compilation)
    .useSourceMap.tap(p, () => true)
}

 /** * @param {{ compilation: webpack.Compilation }} args */
function addSourceMaps({ compilation }) {

  // add source map assets for anything that still has one
  compilation.hooks.afterOptimizeAssets.tap(p, assets => {
    Object.keys(assets).forEach(name => {
      const asset = assets[name]
      const map = asset.map()
      if (map) {

        // TODO: check if we need this:
        // // make sure sources in the source map are timestamped, this helps with hot reloading
        // const now = Date.now()
        // map.sources = map.sources.map(source =>
        //   `${source.includes('?') ? '&' : '?'}${now}`
        // )
        assets[name] = addInlineSourceMapReference({ name, asset })

        assets[name + '.map'] = createSourceMapAsset({ map })
      }
    })
  })
}

function addInlineSourceMapReference({ name, asset }) {
  const [startComment, endComment] = ['//', '']// TODO: CSS: name.endsWith('.css') ? ['/*', ' */'] : ['//', '']
  return new webpackSources.ConcatSource(
    asset,
    `\n${startComment}# sourceMappingURL=${path.basename(name)}.map${endComment}\n`
  )
}

function createSourceMapAsset({ map }) {
  return new webpackSources.RawSource(JSON.stringify(map))
}
