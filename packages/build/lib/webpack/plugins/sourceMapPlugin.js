import webpack from 'webpack'

const p = 'kaliber.sourceMapPlugin'

export function sourceMapPlugin() {

  /** @param {import('webpack').Compiler} compiler */
  return compiler => {
    keepSourceMapInformation(compiler)
  }
}

function keepSourceMapInformation(compiler) {
  // Taken from webpack.SourceMapDevToolModuleOptionsPlugin
  compiler.hooks.thisCompilation.tap(p, compilation => {
    compilation.hooks.buildModule.tap(p, module => {
      module.useSourceMap = true
    })
    compilation.hooks.runtimeModule.tap(p, module => {
      module.useSourceMap = true // we might not want this in production
    })

    webpack.javascript.JavascriptModulesPlugin.getCompilationHooks(compilation)
      .useSourceMap.tap(p, () => true)
  })
}
