/*
  Add plugins based on the target, plugins argument example:

  {
    all: [ ... ],
    node: [ ... ],
    web: [ ... ]
  }
*/

module.exports = function targetBasedPluginsPlugin(plugins) {

  return {
    apply: compiler => {
      plugins.all.forEach(applyPlugin)
      const targetPlugins = plugins[compiler.options.target]
      if (targetPlugins) targetPlugins.forEach(applyPlugin)

      function applyPlugin(plugin) { plugin.apply(compiler) }
    }
  }
}
