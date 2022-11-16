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

/**
 * @template T
 * @param {() => T} init
 */
function createGetHooks(init) {
  const hooksMap = new WeakMap()

  /**
   * @returns {T}
   */
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
  const targetLocation = `__webpack_require__.${abbreviation}`

  compilation.hooks.runtimeRequirementInTree
    .for(targetLocation)
    .tap(pluginName, chunk => {
      const x = new DynamicRuntimeModule(abbreviation, targetLocation, createValue)
      compilation.addRuntimeModule( chunk, x )
      console.log('attached', variableName, 'to', chunk.name)
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
    parser.hooks.expression.for(variableName).tap(pluginName, expr => {
      console.log('parser expression for', variableName)//, expr)
      return JavascriptParserHelpers.toConstantDependency(parser, targetLocation, [targetLocation])(expr)
    })
    parser.hooks.evaluateTypeof.for(variableName).tap(pluginName, JavascriptParserHelpers.evaluateToString(type))
  }
}

class DynamicRuntimeModule extends RuntimeModule {
  constructor(name, targetLocation, createValue) {
    super(name, RuntimeModule.STAGE_TRIGGER)
    this.name = name
    this.targetLocation = targetLocation
    this.createValue = createValue
  }

  generate() {
    console.log('generate', this.name, 'to', this.chunk.name)
    return `${this.targetLocation} = ${JSON.stringify(this.createValue(this.chunk))};`
  }
}


function createChildCompiler(pluginName, compiler, options, { makeAdditionalEntriesPlugin }, name) {
  /* from lib/webpack.js */
  options = new WebpackOptionsDefaulter().process(options)

  const special = {
    experiments: {
      backCompat: false, // https://www.tines.com/blog/understanding-why-our-build-got-15x-slower-with-webpack-5
    }
  }
  const childCompiler = new Compiler(options.context, special, name)
  childCompiler.options = options

  // This is probably a good idea, but it breaks stuff - add the following to css-loader to see if the cache is properly used: console.log('css-loader', filename)
  // childCompiler.cache = compiler.cache
  childCompiler.root = compiler.root

  // childCompiler.cache.hooks.get.tapAsync(pluginName, (id, etag, handlers, callback) => {
  //   if (id.endsWith('.css')) {
  //     compiler.cache.hooks.get.callAsync(id, etag, handlers, callback)
  //   } else {
  //     callback(null, undefined)
  //   }
  // })

  // instead of using the NodeEnvironmentPlugin
  childCompiler.inputFileSystem = compiler.inputFileSystem
  childCompiler.outputFileSystem = compiler.outputFileSystem
  childCompiler.watchFileSystem = compiler.watchFileSystem
  childCompiler.intermediateFileSystem = compiler.intermediateFileSystem

  options.plugins.forEach(plugin => { plugin.apply(childCompiler) })
  childCompiler.hooks.environment.call()
  childCompiler.hooks.afterEnvironment.call()
  childCompiler.options = new WebpackOptionsApply().process(options, childCompiler) // TODO: I recall reading about plugins called before or after something something. Allowing them to alter configuration, so this might need to move elsewhere

  // before we compile, make sure the timestamps (important for caching and changed by watch) are updated
  compiler.hooks.beforeCompile.tap(pluginName, params => {
    childCompiler.fileTimestamps = compiler.fileTimestamps
    childCompiler.contextTimestamps = compiler.contextTimestamps
  })
  // Tell the sub compiler to compile after all entries are added
  makeAdditionalEntriesPlugin.getHooks(compiler).afterAdditionalEntries.tapAsync(pluginName, (compilation, callback) => {
    runSubCompilation(childCompiler, compilation, callback)
  })
  childCompiler.name = name
  return childCompiler
}

function runSubCompilation(subCompiler, compilation, callback) {
  // const startTime = Date.now()
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
    // stats.startTime = startTime
    // stats.endTime = Date.now()

    subCompiler.hooks.done.callAsync(stats, callback)
  }
}
