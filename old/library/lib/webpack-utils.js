const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')
const ParserHelpers = require('webpack/lib/ParserHelpers')
const Compiler = require('webpack/lib/Compiler')
const WebpackOptionsApply = require('webpack/lib/WebpackOptionsApply')
const WebpackOptionsDefaulter = require('webpack/lib/WebpackOptionsDefaulter')
const Stats = require('webpack/lib/Stats')

module.exports = {
  addBuiltInVariable,
  createChildCompiler,
}

// code copied from ExtendedApiPlugin
function addBuiltInVariable({
  compilation, normalModuleFactory, pluginName,
  variableName, type, abbreviation, createValue
}) {

  compilation.dependencyFactories.set(ConstDependency, new NullFactory())
  compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())

  const { mainTemplate } = compilation

  const targetLocation = `${mainTemplate.requireFn}.${abbreviation}`

  mainTemplate.hooks.globalHash.tap(pluginName, () => true)
  mainTemplate.hooks.requireExtensions.tap(pluginName, (source, chunk, hash) => {
    const value = JSON.stringify(createValue(source, chunk, hash))
    const code = [
      source,
      '',
      `// ${variableName}`,
      `${targetLocation} = ${value};`
    ]

    return code.join('\n')
  })

  normalModuleFactory.hooks.parser.for('javascript/auto').tap(pluginName, addParserHooks)
  normalModuleFactory.hooks.parser.for('javascript/dynamic').tap(pluginName, addParserHooks)

  function addParserHooks(parser, parserOptions) {
    parser.hooks.expression.for(variableName).tap(pluginName, ParserHelpers.toConstantDependency(parser, targetLocation))
    parser.hooks.evaluateTypeof.for(variableName).tap(pluginName, ParserHelpers.evaluateToString(type))
  }
}

function createChildCompiler(pluginName, compiler, options) {
  /* from lib/webpack.js */
  options = new WebpackOptionsDefaulter().process(options)

  const childCompiler = new Compiler(options.context)
  childCompiler.options = options

  // instead of using the NodeEnvironmentPlugin
  childCompiler.inputFileSystem = compiler.inputFileSystem
  childCompiler.outputFileSystem = compiler.outputFileSystem
  childCompiler.watchFileSystem = compiler.watchFileSystem

  options.plugins.forEach(plugin => { plugin.apply(childCompiler) })
  childCompiler.hooks.environment.call()
  childCompiler.hooks.afterEnvironment.call()
  childCompiler.options = new WebpackOptionsApply().process(options, childCompiler)

  // make the chunk manifest available
  childCompiler.hooks.compilation.tap(pluginName, compilation => {
    if (!compilation.hooks.chunkManifest) throw new Error('Make sure the chunk-manifest-plugin is installed')
    compilation.hooks.chunkManifest.tap(pluginName, chunkManifest => {
      compilation._kaliber_chunk_manifest_ = chunkManifest
    })
  })

  // before we compile, make sure the timestamps (important for caching and changed by watch) are updated
  compiler.hooks.beforeCompile.tap(pluginName, params => {
    childCompiler.fileTimestamps = compiler.fileTimestamps
    childCompiler.contextTimestamps = compiler.contextTimestamps
  })
  // Tell the sub compiler to compile
  // Note, we can not use `make` because it's parallel
  // We use `stage: 1` to allow plugins to register new entries right before building
  if (!compiler.hooks.makeAdditionalEntries) throw new Error('Make sure the make-addition-entries plugin is installed')
  compiler.hooks.makeAdditionalEntries.tapAsync({ name: pluginName, stage: 1 }, (compilation, _, callback) => {
    runSubCompilation(childCompiler, compilation, callback)
  })

  return childCompiler
}

function runSubCompilation(subCompiler, compilation, callback) {
  const startTime = Date.now()
  subCompiler.compile((err, subCompilation) => {
    if (err) return finish(err)

    compilation.children.push(subCompilation)

    subCompiler.emitAssets(subCompilation, err => {
      if (err) return finish(err)

      finish(null, subCompilation)
    })
  })

  function finish(err, compilation) {
    if (err) {
      subCompiler.hooks.failed.call(err)
      return callback(err)
    }

    const stats = new Stats(compilation)
    stats.startTime = startTime
    stats.endTime = Date.now()

    subCompiler.hooks.done.callAsync(stats, callback)
  }
}
