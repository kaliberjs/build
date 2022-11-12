const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')
const JavascriptParserHelpers = require('webpack/lib/javascript/JavascriptParserHelpers')
const Compiler = require('webpack/lib/Compiler')
const WebpackOptionsApply = require('webpack/lib/WebpackOptionsApply')
const WebpackOptionsDefaulter = require('webpack/lib/WebpackOptionsDefaulter')
const Stats = require('webpack/lib/Stats')
const { RuntimeModule } = require('webpack')

module.exports = {
  addBuiltInVariable,
  createChildCompiler,
  createGetHooks,
}

function createGetHooks(init) {
  const hooksMap = new WeakMap()

  return function getHooks(scope) {
    const hooks = hooksMap.get(scope)
    if (hooks) return hooks

    return hooksMap
      .set(scope, init())
      .get(scope)
  }
}

// code copied from ExtendedApiPlugin
function addBuiltInVariable({
  compilation, normalModuleFactory, pluginName,
  variableName, type, abbreviation, createValue
}) {
  const { mainTemplate } = compilation
  const targetLocation = `${mainTemplate.requireFn}.${abbreviation}`

  compilation.hooks.runtimeRequirementInTree
    .for(targetLocation)
    .tap(pluginName, chunk => {
      const x = new RuntimeModule(abbreviation, RuntimeModule.STAGE_ATTACH)
      x.generate = () => `${targetLocation} = ${JSON.stringify(createValue(x.chunk))};`
      compilation.addRuntimeModule( chunk, x )
      return true
    })

  compilation.dependencyFactories.set(ConstDependency, new NullFactory())
  compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template())

  // mainTemplate.hooks.globalHash.tap(pluginName, () => true)
  // mainTemplate.hooks.requireExtensions.tap(pluginName, (source, chunk, hash) => {
  //   const value = JSON.stringify(createValue(chunk))
  //   const code = [
  //     source,
  //     '',
  //     `// ${variableName}`,
  //     `${targetLocation} = ${value};`
  //   ]

  //   return code.join('\n')
  // })

  normalModuleFactory.hooks.parser.for('javascript/auto').tap(pluginName, addParserHooks)
  normalModuleFactory.hooks.parser.for('javascript/dynamic').tap(pluginName, addParserHooks)
  normalModuleFactory.hooks.parser.for('javascript/esm').tap(pluginName, addParserHooks)

  function addParserHooks(parser, parserOptions) {
    parser.hooks.expression.for(variableName).tap(pluginName, JavascriptParserHelpers.toConstantDependency(parser, targetLocation, [targetLocation]))
    parser.hooks.evaluateTypeof.for(variableName).tap(pluginName, JavascriptParserHelpers.evaluateToString(type))
  }
}

function createChildCompiler(pluginName, compiler, options, { makeAdditionalEntries, chunkManifestPlugin }, name) {
  /* from lib/webpack.js */
  options = new WebpackOptionsDefaulter().process(options)

  console.log('**', name)
  const childCompiler = new Compiler(options.context, { experiments: {} }, name)
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
    chunkManifestPlugin.getHooks(compilation).chunkManifest.tap(pluginName, chunkManifest => {
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
  // if (!compiler.hooks.makeAdditionalEntries) throw new Error('Make sure the make-addition-entries plugin is installed')
  makeAdditionalEntries.getHooks(compiler).makeAdditionalEntries
    .tapAsync({ name: pluginName, stage: 1 }, (compilation, _, callback) => {
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
