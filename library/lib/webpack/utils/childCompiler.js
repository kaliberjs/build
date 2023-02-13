const webpack = require('webpack')
const { makePathsRelative } = require('webpack/lib/util/identifier')

module.exports = { createChildCompiler, runAsChild }
// Copied from createChildCompiler in Compilation and Compiler combined with info from
/**
 * @param {{
 *   configuration: webpack.Configuration,
 *   compiler: webpack.Compiler,
 * }} props
 */
function createChildCompiler({ configuration, compiler }) {
  const childCompiler = webpack(configuration)

  const compilerName = childCompiler.name

  childCompiler.outputPath = compiler.outputPath
  childCompiler.inputFileSystem = compiler.inputFileSystem
  childCompiler.outputFileSystem = null
  childCompiler.resolverFactory = compiler.resolverFactory
  childCompiler.modifiedFiles = compiler.modifiedFiles
  childCompiler.removedFiles = compiler.removedFiles
  childCompiler.fileTimestamps = compiler.fileTimestamps
  childCompiler.contextTimestamps = compiler.contextTimestamps
  childCompiler.fsStartTime = compiler.fsStartTime
  childCompiler.cache = compiler.cache
  childCompiler.compilerPath = `${compiler.compilerPath}${compilerName}|`

  const relativeCompilerName = makePathsRelative(
    compiler.context,
    compilerName,
    compiler.root
  )

  if (compiler.records[relativeCompilerName]) {
    childCompiler.records = this.records[relativeCompilerName]
  } else {
    this.records[relativeCompilerName] = childCompiler.records = {}
  }

  // childCompiler.parentCompilation = compilation
  childCompiler.root = compiler.root

  return childCompiler
}

// Copied from runAsChild from Compiler
function runAsChild({ parentCompilation, childCompiler, callback }) {
  const startTime = Date.now()

  childCompiler.compile((err, compilation) => {
    if (err) return finalCallback(err)

    parentCompilation.children.push(compilation)
    for (const { name, source, info } of compilation.getAssets()) {
      parentCompilation.emitAsset(name, source, info)
    }

    const entries = []
    for (const ep of compilation.entrypoints.values()) {
      entries.push(...ep.chunks)
    }

    compilation.startTime = startTime
    compilation.endTime = Date.now()

    return finalCallback(null, entries, compilation)
  })

  function finalCallback(err, entries, compilation) {
    try {
      callback(err, entries, compilation)
    } catch (e) {
      const err = new webpack.WebpackError(
        `compiler.runAsChild callback error: ${e}`
      )
      err.details = e.stack
      parentCompilation.errors.push(err)
    }
  };
}
