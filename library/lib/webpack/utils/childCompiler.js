const webpack = require('webpack')
const { makePathsRelative } = require('webpack/lib/util/identifier')

/**
 * Idealy we would use the `createChildCompiler` function from webpack.Compilation. This however
 * creates a compiler based on the current compiler (it's plugins and options) with only different
 * output options.
 *
 * The `target` option (which can not be set with `createChildCompiler`) is the most problematic
 * option as this branches into a multitude of other options that may or may not be used by plugins.
 *
 * In order to have a somewhat maintainable version we will combine code from the following
 * locations:
 * - Compilation.js#createChildCompiler
 * - Compiler.js#createChildCompiler
 * - webpack.js
 */


module.exports = { createChildCompiler }
/**
 * Creates a child compiler (similar to compilation.createChildCompiler). The difference is that it
 * expects a full webpack configuration allowing for a different target for example.
 *
 * IMPORTANT: run this compiler with the `compiler.runAsChild(callback)` function.
 *
 * @param {{
 *   configuration: webpack.Configuration,
 *   compiler: webpack.Compiler,
 *   compilation: webpack.Compilation,
 * }} props
 */
function createChildCompiler({
  configuration,
  compiler: parentCompiler,
  compilation: parentCompilation,
}) {
  if (!configuration.name) throw new Error('Configuration should have a name')
  const { name } = configuration

  const options = {
    ...configuration,
    plugins: [
      // read the comment at these plugins for more information
      ReplaceNodeEnvironmentPluginEffectsPlugin({ parentCompiler }),
      ApplyChildCompilerEffectsPlugin({ name, parentCompiler, parentCompilation }),
    ].concat(configuration.plugins || [])
  }

  const childCompiler = webpack(options)

  return childCompiler
}

/**
 * This plugin replaces the effect of the NodeEnvironmentPlugin. These effect should only be applied
 * to the root compiler. This module copies the properties that are normally (in webpack.js) set by
 * the NodeEnvironmentPlugin from the parent compiler.
 */
function ReplaceNodeEnvironmentPluginEffectsPlugin({ parentCompiler }) {
  return {
    /** @param {webpack.Compiler} compiler */
    apply(compiler) {
      compiler.infrastructureLogger = parentCompiler.infrastructureLogger
      compiler.inputFileSystem = parentCompiler.inputFileSystem
      compiler.outputFileSystem = parentCompiler.outputFileSystem
      compiler.intermediateFileSystem = parentCompiler.intermediateFileSystem
      compiler.watchFileSystem = parentCompiler.watchFileSystem
    }
  }
}

/**
 * This plugin copies the logic from `Compilation.createChildCompiler` and
 * `Compiler.createChildCompiler` that should be applied directly after compiler creation
 */
const childCounters = new WeakMap()
function ApplyChildCompilerEffectsPlugin({ name, parentCompiler, parentCompilation }) {
  const childrenCounters = childCounters.get(parentCompilation) ||
    childCounters.set(parentCompilation, {}).get(parentCompilation)

  return {
    /** @param {webpack.Compiler} compiler */
    apply(compiler) {
      // from Compilation.createChildCompiler
      const compilerIndex = childrenCounters[name] || 0
      childrenCounters[name] = compilerIndex + 1

      // from Compiler.createChildCompiler
      compiler.outputPath = parentCompiler.outputPath
      compiler.inputFileSystem = parentCompiler.inputFileSystem
      compiler.outputFileSystem = null
      compiler.resolverFactory = parentCompiler.resolverFactory
      compiler.modifiedFiles = parentCompiler.modifiedFiles
      compiler.removedFiles = parentCompiler.removedFiles
      compiler.fileTimestamps = parentCompiler.fileTimestamps
      compiler.contextTimestamps = parentCompiler.contextTimestamps
      compiler.fsStartTime = parentCompiler.fsStartTime
      compiler.cache = parentCompiler.cache
      compiler.compilerPath = `${parentCompiler.compilerPath}${name}|${compilerIndex}|`
      compiler._backCompat = parentCompiler._backCompat

      const relativeCompilerName = makePathsRelative(
        parentCompiler.context,
        name,
        parentCompiler.root
      )
      if (!parentCompiler.records[relativeCompilerName]) {
        parentCompiler.records[relativeCompilerName] = []
      }
      if (parentCompiler.records[relativeCompilerName][compilerIndex]) {
        compiler.records = parentCompiler.records[relativeCompilerName][compilerIndex]
      } else {
        parentCompiler.records[relativeCompilerName].push((compiler.records = {}))
      }

      compiler.parentCompilation = parentCompilation
      compiler.root = parentCompiler.root

      /*
        Skipping the following sections from Compiler.createChildCompiler:

        - Applying plugins -- this will already be done after this plugin is executed)
        - Nullifying certain hooks (removing the taps), this is done by removing the taps of
          certain hooks -- we do not apply the plugins from the parent compiler so we don't have to
          remove the taps.
        - Calling the 'childCompiler' hook -- this is not used by any of the internal plugins
      */
    }
  }
}
