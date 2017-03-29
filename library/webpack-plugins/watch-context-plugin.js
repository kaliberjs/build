module.exports = function watchContextPlugin() {
  return {
    apply: compiler => {
      compiler.plugin('after-compile', (compilation, done) => {
        compilation.contextDependencies.push(compiler.options.context)
        done()
      })
    }
  }
}
