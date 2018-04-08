/*
  Simply adds the context as a context dependency
*/

const p = 'watch-context-plugin'

module.exports = function watchContextPlugin() {
  return {
    apply: compiler => {
      compiler.hooks.afterCompile.tap(p, compilation => {
        compilation.contextDependencies.add(compiler.options.context)
      })
    }
  }
}
