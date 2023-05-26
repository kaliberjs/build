const path = require('path')
const walkSync = require('walk-sync')

/*
  Simply adds the context as a context dependency
*/

const p = 'watch-context-plugin'

module.exports = function watchContextPlugin() {
  return {
    apply: compiler => {
      compiler.hooks.afterCompile.tap(p, compilation => {
        compilation.contextDependencies.add(compiler.options.context)
        walkSync(compiler.options.context, { globs: ['**/']}).forEach(x => {
          compilation.contextDependencies.add(path.join(compiler.options.context, x))
        })
      })
    }
  }
}
