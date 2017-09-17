
// Add plugins based on the target, plugins argument example:
//
// {
//   all: [ ... ],
//   node: [ ... ],
//   web: [ ... ]
//}

module.exports = function targetBasedPluginsPlugin(plugins) {

  return {
    apply: compiler => {
      compiler.apply.apply(compiler, plugins.all)
      const targetPlugins = plugins[compiler.options.target]
      if (targetPlugins) compiler.apply.apply(compiler, targetPlugins)
    }
  }
}
