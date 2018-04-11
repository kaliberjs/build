const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const NullFactory = require('webpack/lib/NullFactory')
const ParserHelpers = require('webpack/lib/ParserHelpers')

module.exports = {
  addBuiltInVariable
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
