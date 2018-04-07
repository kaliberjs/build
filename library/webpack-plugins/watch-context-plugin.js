/*
  Simply adds the context as a context dependency
*/

const p = 'watch-context-plugin'

module.exports = function watchContextPlugin() {
  return {
    apply: compiler => {
      compiler.hooks.afterCompile.tapAsync(p, (compilation, done) => {
        compilation.contextDependencies.add(compiler.options.context)
        done()
      })
    }
  }
}
