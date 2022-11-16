const path = require('path')
const walkSync = require('walk-sync')

/*
  Simply adds the context as a context dependency
*/

const p = 'watch-context-plugin'

module.exports = function watchContextPlugin() {
  return {
    apply: compiler => {
      // TODO: we might need another way to solve this (it might even already be present by default or in an internal plugin)
      compiler.hooks.afterCompile.tap(p, compilation => {
        compilation.contextDependencies.add(compiler.options.context)
        walkSync(compiler.options.context, { globs: ['**/'] }).forEach(x => {
          compilation.contextDependencies.add(path.join(compiler.options.context, x))
        })
      })
    }
  }
}
